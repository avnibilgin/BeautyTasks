import { Modal, Notice, setIcon } from "obsidian";
import { PromptModal } from "./confirmModal";
import type BeautyTasksPlugin from "./main";
import { baseName, isInboxLink, listProjectsAndAreas } from "./taskService";
import { openPopover, popRow } from "./popover";
import { openDatePicker } from "./datePicker";
import { dateOf, formatDate, todayStr } from "./format";
import { AnchorMode } from "./templatePlan";
import { applyTemplate, createEmptyTemplate, listTemplates, refreshTemplates, TemplateInfo } from "./templateService";
import { t, projectDisplayName } from "./i18n";

/**
 * Die zwei Dialoge der Vorlagen: eine auswählen und eine anwenden.
 *
 * Der Anwenden-Dialog fragt bewusst nur nach ZWEI Dingen – wohin und ab wann. Alles andere steht
 * bereits in der Vorlage. Die Anker-Frage hat zwei Richtungen („Start am" / „Fertig bis"), weil
 * etwa die Hälfte aller Vorlagen von einem Endtermin her gedacht ist: Wer den Abflugtag kennt,
 * soll nicht selbst zurückrechnen müssen.
 */

/** Vorlagen-Auswahl (Kommandopalette). Leitet auf den Anwenden-Dialog weiter. */
export class PickTemplateModal extends Modal {
  constructor(private plugin: BeautyTasksPlugin, private defaultProject: string | null = null) { super(plugin.app); }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-new-modal");
    contentEl.createEl("h3", { text: t("tpl_pick_title") });

    const list = listTemplates(this.plugin);
    if (!list.length) {
      contentEl.createEl("p", { cls: "bt-empty", text: t("tpl_none") });
      return;
    }
    const box = contentEl.createDiv({ cls: "bt-tpl-list" });
    for (const tpl of list) {
      const row = popRow(box, tpl.kind === "project" ? "folder-plus" : "clipboard-list", tpl.name, () => {
        this.close();
        new ApplyTemplateModal(this.plugin, tpl, this.defaultProject).open();
      });
      row.createSpan({ cls: "bt-nav-count", text: String(tpl.size) });
    }
  }

  onClose(): void { this.contentEl.empty(); }
}

/** Anwenden-Dialog: Zielprojekt + Anker (Richtung und Datum). */
export class ApplyTemplateModal extends Modal {
  private project: string | null;
  private mode: AnchorMode = "start";
  private anchor: string | null = todayStr();
  /** Nur Projektvorlagen: true = neues Projekt anlegen, false = in ein bestehendes giessen. */
  private makeNew = true;
  private newProject: string | null = null;
  private newBtn?: HTMLButtonElement;
  private oldBtn?: HTMLButtonElement;
  private nameInput?: HTMLInputElement;
  private projektBtn!: HTMLButtonElement;
  private dateBtn!: HTMLButtonElement;
  private startBtn!: HTMLButtonElement;
  private endBtn!: HTMLButtonElement;

  constructor(private plugin: BeautyTasksPlugin, private tpl: TemplateInfo, defaultProject: string | null = null) {
    super(plugin.app);
    // Vorbelegung, in dieser Reihenfolge: das Projekt, das sich die Vorlage gemerkt hat – sonst
    // die Seite, von der aus der Dialog geöffnet wurde – sonst der Eingang.
    //
    // Die Erinnerung der Vorlage steht VORN: Wer eine Vorlage anwendet, meint fast immer dasselbe
    // Ziel wie beim letzten Mal; wo man gerade steht, ist demgegenüber Zufall. `tpl.root.project`
    // ist bereits ein aufgelöster Pfad – gibt es das Projekt nicht mehr, steht dort null und die
    // nächste Stufe greift.
    const gemerkt = tpl.root.project ? baseName(tpl.root.project) : null;
    this.project = gemerkt ?? defaultProject;

    // Projektvorlage, und es gibt bereits ein Projekt ODER einen Bereich mit ihrem Namen? Dann
    // ist fast immer DAS gemeint. Der Dialog startet deshalb auf „Bestehendes Projekt" mit genau
    // diesem Ziel – „Neues Projekt" bliebe zwar einen Klick entfernt, legte aber stillschweigend
    // ein zweites „Wunschliste 2" an (createProjectNote weicht bei Namensgleichheit aus).
    //
    // Verglichen wird ohne Rücksicht auf Gross-/Kleinschreibung, wie überall bei Projektnamen
    // (s. resolveProjectPath).
    if (tpl.kind === "project") {
      const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
      const treffer = [...bereiche, ...projekte].find((p) => p.name.toLowerCase() === tpl.name.toLowerCase());
      if (treffer) { this.makeNew = false; this.project = treffer.name; }
    }
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    // `bt-tpl-modal` zusätzlich: `bt-new-modal` teilt sich dieser Dialog mit NewItemModal, und die
    // Abstände unten sollen nur HIER gelten.
    modalEl.addClasses(["bt-new-modal", "bt-tpl-modal"]);
    contentEl.createEl("h3", { text: t("tpl_apply_title") });

    // Kopf: WAS wird hier angewendet. Zweizeilig – Name gross, darunter Art und Umfang. Der
    // Dialog wird auch aus der Kommandopalette erreicht, wo der Name sonst nirgends mehr stünde,
    // und ohne die zweite Zeile bliebe „10" eine Zahl ohne Einheit.
    //
    // OHNE Icon: Die zweite Zeile sagt bereits im Klartext, ob es eine Aufgaben- oder eine
    // Projektvorlage ist. Ein Symbol daneben wiederholte nur dieselbe Aussage in undeutlicher.
    // (In der Vorlagen-AUSWAHL bleibt es – dort gibt es keine zweite Zeile, die es sagen könnte.)
    contentEl.createEl("h4", { cls: "bt-modal-h", text: t("filter_name") });
    const head = contentEl.createDiv({ cls: "bt-tpl-head" });
    head.createDiv({ cls: "bt-tpl-head-nm", text: this.tpl.name });
    head.createDiv({ cls: "bt-tpl-head-sub",
      text: t(this.tpl.kind === "project" ? "tpl_kind_project" : "tpl_kind_task") + " · " + t("cal_tasks", this.tpl.size) });

    // Ziel. Eine Aufgabenvorlage braucht ein Projekt, in das die Aufgabe geht. Eine
    // Projektvorlage hat die Wahl: ein NEUES Projekt anlegen oder in ein bestehendes giessen –
    // Letzteres ist der Fall „ich will nur die Aufgaben hier drin haben, ohne neues Dach".
    contentEl.createEl("h4", { cls: "bt-modal-h", text: t("tpl_target") });
    const projField = contentEl.createDiv({ cls: "bt-new-field" });
    if (this.tpl.kind === "project") {
      const pick = projField.createDiv({ cls: "bt-tpl-anchor" });
      this.newBtn = pick.createEl("button", { text: t("tpl_new_project") });
      this.oldBtn = pick.createEl("button", { text: t("tpl_existing_project") });
      this.newBtn.onclick = () => this.setTargetMode(true);
      this.oldBtn.onclick = () => this.setTargetMode(false);
      this.nameInput = projField.createEl("input", { cls: "bt-new-input", attr: { type: "text", placeholder: t("placeholder_project_name") } });
      this.nameInput.value = this.tpl.name;   // Vorbelegung: der Name der Vorlage
      this.nameInput.oninput = () => { this.newProject = this.nameInput!.value; };
      this.newProject = this.tpl.name;
    }
    this.projektBtn = projField.createEl("button", { cls: "bt-projekt" });
    this.projektBtn.onclick = (e) => this.openProject(e.currentTarget as HTMLElement);
    this.renderProjekt();
    if (this.tpl.kind === "project") this.renderTargetMode();

    // Anker: Richtung + Datum. Die Richtung sind zwei Knöpfe statt eines Umschalters – beide
    // Beschriftungen bleiben lesbar, und man sieht ohne Klick, dass es die zweite Möglichkeit gibt.
    contentEl.createEl("h4", { cls: "bt-modal-h", text: t("tpl_schedule") });
    const ankField = contentEl.createDiv({ cls: "bt-new-field" });
    const row = ankField.createDiv({ cls: "bt-new-row bt-tpl-when" });
    const dir = row.createDiv({ cls: "bt-tpl-anchor" });
    this.startBtn = dir.createEl("button", { text: t("tpl_anchor_start") });
    this.endBtn = dir.createEl("button", { text: t("tpl_anchor_end") });
    this.startBtn.onclick = () => this.setMode("start");
    this.endBtn.onclick = () => this.setMode("end");
    this.dateBtn = row.createEl("button", { cls: "bt-projekt" });
    this.dateBtn.onclick = (e) => openDatePicker(e.currentTarget as HTMLElement, this.anchor ?? "", (iso) => {
      this.anchor = iso ? dateOf(iso) : null;
      this.renderDate();
    });
    this.renderMode();
    this.renderDate();

    ankField.createEl("p", { cls: "bt-tpl-note", text: t("tpl_keeps_gaps") });

    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();   // Platzhalter links, damit die Knöpfe rechts stehen
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: t("menu_apply_template") }).onclick = () => void this.submit();
  }

  onClose(): void { this.contentEl.empty(); }

  private setMode(m: AnchorMode): void { this.mode = m; this.renderMode(); }

  private setTargetMode(makeNew: boolean): void { this.makeNew = makeNew; this.renderTargetMode(); }

  /** Entweder das Namensfeld ODER die Projektauswahl – nie beides. Zwei sichtbare Ziele, von
   *  denen nur eines zählt, wären eine Einladung, das falsche auszufüllen. */
  private renderTargetMode(): void {
    this.newBtn?.toggleClass("mod-cta", this.makeNew);
    this.oldBtn?.toggleClass("mod-cta", !this.makeNew);
    this.nameInput?.toggleClass("bt-hidden", !this.makeNew);
    this.projektBtn.toggleClass("bt-hidden", this.makeNew);
  }

  private renderMode(): void {
    this.startBtn.toggleClass("mod-cta", this.mode === "start");
    this.endBtn.toggleClass("mod-cta", this.mode === "end");
  }

  private renderDate(): void {
    this.dateBtn.empty();
    setIcon(this.dateBtn.createSpan({ cls: "bt-projekt-ic" }), "calendar");
    this.dateBtn.createSpan({ text: this.anchor ? formatDate(this.anchor) : t("chip_date") });
  }

  private renderProjekt(): void {
    this.projektBtn.empty();
    const { bereiche, projekte } = listProjectsAndAreas(this.app);
    const inbox = isInboxLink(this.project);
    const sel = inbox ? null : [...bereiche, ...projekte].find((p) => p.name === this.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    setIcon(ic, inbox ? "inbox" : (sel?.icon ?? "folder"));
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: inbox ? t("nav_inbox") : projectDisplayName(this.project) });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" });
    setIcon(car, "chevron-down");
  }

  private openProject(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      const { bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name: string | null): void => { this.project = name; this.renderProjekt(); close(); };
      popRow(pop, "inbox", t("nav_inbox"), () => pick(null), isInboxLink(this.project));
      const group = (title: string, items: { name: string; icon: string; color: string | null }[]): void => {
        if (!items.length) return;
        pop.createDiv({ cls: "bt-pop-head", text: title });
        for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), this.project === it.name, it.color ?? undefined);
      };
      group(t("group_area"), bereiche);
      group(t("group_project"), projekte);
    });
  }

  private async submit(): Promise<void> {
    // Ein neues Projekt braucht einen Namen. Ohne ihn bliebe der Dialog wortlos wirkungslos –
    // die Aufgaben landeten im Eingang, und niemand wüsste, warum.
    const neu = this.tpl.kind === "project" && this.makeNew ? (this.newProject ?? "").trim() : null;
    if (this.tpl.kind === "project" && this.makeNew && !neu) { new Notice(t("new_need_name")); return; }
    const n = await applyTemplate(this.plugin, this.tpl.root.path, {
      project: this.project,
      newProject: neu,
      anchor: this.anchor,
      mode: this.mode,
    });
    this.close();
    new Notice(t("msg_template_applied", n));
  }
}

/** „+ Vorlage erstellen": Name abfragen, leere Vorlage anlegen, Seitenleiste nachziehen. */
export function promptNewTemplate(plugin: BeautyTasksPlugin): void {
  new PromptModal(plugin.app, { title: t("create_template"), placeholder: t("placeholder_taskname") }, (name) => {
    void createEmptyTemplate(plugin, name).then(() => refreshTemplates(plugin));
  }).open();
}

