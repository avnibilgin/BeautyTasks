// Kommentar-Log (Timeline + Composer mit Anhang/Link/Senden), gemeinsam für vollen Editor und
// Schnelleingabe. Herausgelöst aus taskModal, damit beide Eingabe-Modale identisch funktionieren.
// Bei einer neuen Aufgabe (noch keine Datei) werden die Einträge im Speicher gepuffert und beim
// Anlegen über flush() in den Notiz-Body geschrieben; bei bestehender Aufgabe live (persistLog).
import { App, TFile, Notice, setIcon, normalizePath, MarkdownRenderer, Component, FuzzySuggestModal } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { LogEntry, writeLog, nowLogTs, formatLogTime } from "./detailLog";
import { ensureFolder } from "./taskService";
import { t } from "./i18n";

/** Callbacks, die pro Modal unterschiedlich sind. */
export interface DetailLogHost {
  srcPath(): string;          // Quell-Pfad für Links/MarkdownRenderer (bestehende Notiz oder Platzhalter)
  file(): TFile | null;       // Ziel-Datei für Live-Persistenz (null = neue Aufgabe -> nur Speicher)
  reveal(): void;             // Log-Sektion sichtbar machen (nach Eintrag/Anhang)
  close(): void;              // Modal schließen (Klick auf internen Link)
}

export class DetailLogView {
  private entries: LogEntry[] = [];
  private comp: Component | null = null;
  private input: HTMLTextAreaElement | null = null;
  private chain: Promise<void> = Promise.resolve();
  private wrap!: HTMLElement;
  private collapsed = false;   // Sektion zugeklappt (nur für die Lebensdauer des Modals)

  constructor(private app: App, private plugin: BeautyTasksPlugin, private host: DetailLogHost) {}

  mount(wrap: HTMLElement): void { this.wrap = wrap; this.render(); }
  setEntries(entries: LogEntry[]): void { this.entries = entries; }
  hasEntries(): boolean { return this.entries.length > 0; }
  focusComposer(): void {
    if (this.collapsed) { this.collapsed = false; this.render(); }
    this.input?.focus();
  }
  unload(): void { this.comp?.unload(); }

  /** Beim Anlegen einer neuen Aufgabe: gepufferte Einträge in die frische Datei schreiben. */
  async flush(file: TFile): Promise<void> { if (this.entries.length) await writeLog(this.app, file, this.entries); }

  /** Kopfzeile + Timeline der Einträge (Zeitstempel + Markdown + Bearbeiten/Löschen) + Composer. */
  render(): void {
    const wrap = this.wrap; wrap.empty();
    this.comp?.unload();
    this.comp = new Component(); this.comp.load();
    const src = this.host.srcPath();

    // Kopfzeile wie in der Unteraufgaben-Sektion (gemeinsame .bt-sec-*-Klassen): Chevron zum
    // Ein-/Ausklappen, Titel, Anzahl. Zugeklappt bleibt nur die Zeile stehen.
    const head = wrap.createDiv({ cls: "bt-sec-head" });
    const toggle = head.createEl("button", {
      cls: "bt-sec-toggle",
      attr: { "aria-expanded": String(!this.collapsed), "aria-label": t("comments") },
    });
    setIcon(toggle.createSpan({ cls: "bt-sec-caret" }), this.collapsed ? "chevron-right" : "chevron-down");
    toggle.createSpan({ cls: "bt-sec-title", text: t("comments") });
    if (this.entries.length) toggle.createSpan({ cls: "bt-sec-count", text: String(this.entries.length) });
    toggle.onclick = () => { this.collapsed = !this.collapsed; this.render(); };
    if (this.collapsed) { this.input = null; return; }

    const list = wrap.createDiv({ cls: "bt-log-list" });
    // Klicks in den gerenderten Kommentaren: Bilder öffnen die Lightbox, interne
    // Links (Notizen/PDF) öffnen im Tab. MarkdownRenderer verdrahtet im Modal keine
    // Navigation. Delegation am transienten `list` (bei jedem Re-Render neu erzeugt)
    // → kein manuelles Cleanup, kein doppelter Listener.
    list.addEventListener("click", (e) => {
      if (!(e.target instanceof HTMLElement)) return;
      const img = e.target.closest(".bt-log-content img");
      if (img instanceof HTMLImageElement) {
        e.preventDefault();
        const imgs = Array.from(list.querySelectorAll<HTMLImageElement>(".bt-log-content img"));
        this.openLightbox(imgs, imgs.indexOf(img));
        return;
      }
      const link = e.target.closest("a.internal-link");
      if (link) {
        const href = link.getAttribute("data-href") || link.getAttribute("href");
        if (href) { e.preventDefault(); void this.app.workspace.openLinkText(href, src, true); this.host.close(); }
      }
    });
    this.entries.forEach((entry, idx) => {
      const row = list.createDiv({ cls: "bt-log-entry" });
      const head = row.createDiv({ cls: "bt-log-head" });
      head.createDiv({ cls: "bt-log-ts", text: formatLogTime(entry.ts) || "—" });
      const content = row.createDiv({ cls: "bt-log-content" });
      this.renderEntry(content, entry, src);
      const acts = head.createDiv({ cls: "bt-log-actions" });
      const ed = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("log_edit") } });
      setIcon(ed.createSpan(), "pencil");
      ed.onclick = () => this.editEntry(idx, content);
      const del = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("btn_delete") } });
      setIcon(del.createSpan(), "trash-2");
      del.onclick = () => { this.entries.splice(idx, 1); this.render(); void this.persistLog(); };
    });
    const comp = wrap.createDiv({ cls: "bt-log-composer" });
    const inp = comp.createEl("textarea", { cls: "bt-log-input", attr: { placeholder: t("log_placeholder"), rows: "1" } });
    this.input = inp;
    const grow = () => { inp.setCssStyles({ height: "auto" }); inp.setCssStyles({ height: Math.min(inp.scrollHeight, 220) + "px" }); };
    inp.oninput = grow;
    inp.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.addEntry(); } };
    inp.onpaste = (ev) => { const f = ev.clipboardData?.files; if (f && f.length) { ev.preventDefault(); void this.handleFiles(f); } };
    inp.ondragover = (ev) => { ev.preventDefault(); inp.addClass("bt-drop"); };
    inp.ondragleave = () => inp.removeClass("bt-drop");
    inp.ondrop = (ev) => { const f = ev.dataTransfer?.files; if (f && f.length) { ev.preventDefault(); ev.stopPropagation(); inp.removeClass("bt-drop"); void this.handleFiles(f); } };
    const cActs = comp.createDiv({ cls: "bt-log-composer-actions" });
    const attach = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_attach") } });
    setIcon(attach.createSpan(), "paperclip");
    attach.onclick = () => this.pickAttachment();
    const linkBtn = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_link") } });
    setIcon(linkBtn.createSpan(), "link");
    linkBtn.onclick = () => this.pickNote();
    const add = cActs.createEl("button", { cls: "bt-log-add", attr: { "aria-label": t("log_add") } });
    setIcon(add.createSpan(), "send-horizontal");
    add.onclick = () => this.addEntry();
    window.setTimeout(() => { list.scrollTop = list.scrollHeight; }, 0);
  }

  private renderEntry(el: HTMLElement, entry: LogEntry, src: string): void {
    el.empty();
    void Promise.resolve(MarkdownRenderer.render(this.app, entry.body || "", el, src, this.comp!))
      .catch((e) => console.error("bt-log render", e));
  }

  /** Bild-Lightbox über dem Modal: navigiert über alle Kommentar-Bilder (Pfeiltasten/
   *  Buttons), Esc oder Klick auf den Hintergrund schließt. Das Overlay ist transient –
   *  nur der Tastatur-Listener braucht Cleanup, darum das Fenster fixieren (Popout-Drift). */
  private openLightbox(imgs: HTMLImageElement[], startIndex: number): void {
    if (!imgs.length) return;
    let i = Math.max(0, Math.min(startIndex, imgs.length - 1));
    const many = imgs.length > 1;
    const doc = activeDocument;

    const ov = doc.body.createDiv("bt-lightbox");
    const stage = ov.createDiv("bt-lb-stage");
    const view = stage.createEl("img", { cls: "bt-lb-img" });
    const counter = many ? ov.createDiv("bt-lb-counter") : null;

    const show = () => { view.src = imgs[i].src; counter?.setText((i + 1) + " / " + imgs.length); };
    const go = (d: number) => { i = (i + d + imgs.length) % imgs.length; show(); };
    // Aktuelles Bild als PNG in die Zwischenablage (Canvas -> Blob -> Clipboard-API).
    const copyCurrent = async (): Promise<void> => {
      const img = imgs[i];
      try {
        // Globales createEl (nicht doc.win.createEl – Window hat keins): erzeugt ein loses
        // Element im App-Realm, das nie ins DOM kommt. Nur Zwischenschritt fuer toBlob().
        const canvas = createEl("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("toBlob returned null");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        new Notice(t("msg_image_copied"));
      } catch (err) {
        console.error("BeautyTasks: copy image failed", err);
        new Notice(t("msg_image_copy_failed"));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) { e.preventDefault(); void copyCurrent(); }
      else if (many && e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (many && e.key === "ArrowRight") { e.preventDefault(); go(1); }
    };
    const close = () => { ov.remove(); doc.removeEventListener("keydown", onKey, true); };

    if (many) {
      const nav = (cls: string, icon: string, label: string, d: number) => {
        const b = ov.createEl("button", { cls: "bt-lb-nav " + cls, attr: { "aria-label": label } });
        setIcon(b, icon);
        b.onclick = (e) => { e.stopPropagation(); go(d); };
      };
      nav("bt-lb-prev", "chevron-left", t("lb_prev"), -1);
      nav("bt-lb-next", "chevron-right", t("lb_next"), 1);
    }
    const copyBtn = ov.createEl("button", { cls: "bt-lb-copy", attr: { "aria-label": t("lb_copy") } });
    setIcon(copyBtn, "copy");
    copyBtn.onclick = (e) => { e.stopPropagation(); void copyCurrent(); };
    const closeBtn = ov.createEl("button", { cls: "bt-lb-close", attr: { "aria-label": t("btn_close") } });
    setIcon(closeBtn, "x");
    closeBtn.onclick = (e) => { e.stopPropagation(); close(); };

    view.onclick = (e) => { e.stopPropagation(); if (many) go(1); };
    ov.onclick = (e) => { if (e.target === ov || e.target === stage) close(); };
    doc.addEventListener("keydown", onKey, true);
    show();
  }

  private addEntry(): void {
    const v = (this.input?.value || "").trim();
    if (!v) return;
    this.entries.push({ ts: nowLogTs(), body: v });
    this.collapsed = false;   // ein neuer Kommentar landet nie in einer zugeklappten Sektion
    this.host.reveal();
    this.render();
    void this.persistLog();
  }

  private editEntry(idx: number, contentEl: HTMLElement): void {
    const entry = this.entries[idx];
    contentEl.empty();
    const ta = contentEl.createEl("textarea", { cls: "bt-log-edit" });
    ta.value = entry.body || "";
    window.setTimeout(() => { ta.setCssStyles({ height: "auto" }); ta.setCssStyles({ height: (ta.scrollHeight + 2) + "px" }); ta.focus(); }, 0);
    const acts = contentEl.createDiv({ cls: "bt-log-edit-acts" });
    const doSave = () => { entry.body = ta.value.trim(); if (!entry.body) this.entries.splice(idx, 1); this.render(); void this.persistLog(); };
    const save = acts.createEl("button", { cls: "bt-log-edit-btn mod-cta", text: t("log_update") });
    save.onclick = doSave;
    const cancel = acts.createEl("button", { cls: "bt-log-edit-btn", text: t("btn_cancel") });
    cancel.onclick = () => this.render();
    ta.onkeydown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
      else if (e.key === "Escape") { e.preventDefault(); this.render(); }
    };
  }

  /** Sofort-Speichern – unabhängig vom Modal-Save. Bei neuen Aufgaben (kein File)
   *  wird der Log erst beim Speichern in den Body geschrieben. Serialisiert (Kette). */
  private async persistLog(): Promise<void> {
    const file = this.host.file();
    if (!file) return;
    this.chain = this.chain.then(async () => {
      try { await writeLog(this.app, file, this.entries); }
      catch (e) { console.error("bt-log persist", e); new Notice(t("err_detail_save")); }
    });
    return this.chain;
  }

  // ── Anhänge ──
  private insertInComposer(text: string): void {
    const el = this.input; if (!el) return;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    el.selectionStart = el.selectionEnd = s + text.length;
    el.dispatchEvent(new Event("input"));
    el.focus();
  }

  private async saveAttachment(file: File): Promise<void> {
    const IMG = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "heic"];
    const dir = this.plugin.settings.attachmentsFolder;
    try {
      const name = file.name || ("Pasted-" + Date.now() + "." + (file.type.split("/")[1] || "bin"));
      const buf = await file.arrayBuffer();
      await ensureFolder(this.app, dir);
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let p = normalizePath(dir + "/" + name); let i = 1;
      while (this.app.vault.getAbstractFileByPath(p)) p = normalizePath(dir + "/" + base + "-" + (i++) + ext);
      const tfile = await this.app.vault.createBinary(p, buf);
      const isImage = IMG.includes((name.split(".").pop() || "").toLowerCase());
      const link = this.app.fileManager.generateMarkdownLink(tfile, this.host.srcPath());
      this.host.reveal();
      this.insertInComposer((isImage ? "!" : "") + link + " ");
      new Notice(t("msg_attached", tfile.name));
    } catch (err) {
      console.error("bt-attachment", err);
      new Notice(t("msg_attach_failed", String((err as Error)?.message || err)));
    }
  }

  private async handleFiles(files: FileList): Promise<void> { for (const f of Array.from(files)) await this.saveAttachment(f); }

  private pickAttachment(): void {
    const fi = createEl("input", { cls: "bt-hidden-file", attr: { type: "file", multiple: "true" } });
    activeDocument.body.appendChild(fi);
    // Einmal-Listener: Element wird nach Auswahl entfernt → kein Leak.
    fi.addEventListener("change", () => { if (fi.files?.length) void this.handleFiles(fi.files); fi.remove(); });
    fi.click();
  }

  private pickNote(): void {
    const app = this.app;
    const src = this.host.srcPath();
    const insert = (f: TFile) => { this.host.reveal(); this.insertInComposer(app.fileManager.generateMarkdownLink(f, src) + " "); };
    class NotePicker extends FuzzySuggestModal<TFile> {
      getItems(): TFile[] { return app.vault.getMarkdownFiles(); }
      getItemText(f: TFile): string { return f.path; }
      onChooseItem(f: TFile): void { insert(f); }
    }
    const picker = new NotePicker(app);
    picker.setPlaceholder(t("log_link_placeholder"));
    picker.open();
  }
}
