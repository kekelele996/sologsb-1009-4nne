import "@shoelace-style/shoelace/dist/shoelace.js";

type BlockType = "heading" | "paragraph" | "image" | "link";
type ReviewStatus = "pending" | "approved" | "needs-work";
type Severity = "error" | "warning" | "info";

interface CommentReply {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

interface CommentItem {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  resolved: boolean;
  replies: CommentReply[];
}

interface ContentBlock {
  id: string;
  type: BlockType;
  text: string;
  accessibleText: string;
  headingLevel?: number;
  imageSrc?: string;
  imageAlt?: string;
  linkHref?: string;
  changeReason: string;
  reviewStatus: ReviewStatus;
  comments: CommentItem[];
}

interface GlossaryTerm {
  id: string;
  source: string;
  preferred: string;
  note: string;
}

interface VersionSnapshot {
  id: string;
  label: string;
  createdAt: string;
  blocks: ContentBlock[];
  glossary: GlossaryTerm[];
}

type NavTableStatus = "draft" | "confirmed";
type NavEntryStatus = "active" | "suspended";

interface NavEntry {
  id: string;
  blockId: string;
  /** 朗读先后（块编号），挂起条目保留挂起前的旧编号 */
  order: number;
  /** 所属分节，取最近的上级（H1/H2）标题文本 */
  section: string;
  /** 条目快照文案，块被删除后仍可在挂起区展示 */
  label: string;
  role: string;
  status: NavEntryStatus;
  note?: string;
  formerOrder?: number;
  suspendedAt?: string;
}

interface NavigationTable {
  /** draft = 旧稿升级或重新导入后补出的待确认初稿；confirmed = 服务中心已确认 */
  status: NavTableStatus;
  entries: NavEntry[];
  updatedAt: string;
}

/** 服务中心侧存储的导航表条目（中心只认块编号、朗读先后与分节） */
interface CenterNavEntry {
  blockId: string;
  order: number;
  section: string;
  label: string;
  role: string;
}

interface CenterRecord {
  projectId: string;
  entries: CenterNavEntry[];
  updatedAt: string;
}

interface ChapterProject {
  id: string;
  title: string;
  subject: string;
  grade: string;
  blocks: ContentBlock[];
  glossary: GlossaryTerm[];
  versions: VersionSnapshot[];
  navTable?: NavigationTable;
  updatedAt: string;
}

interface AccessibilityIssue {
  id: string;
  blockId: string;
  type: "heading" | "link" | "image" | "glossary" | "sentence";
  severity: Severity;
  title: string;
  detail: string;
  suggestion: string;
}

const STORAGE_KEY = "sologsb-1009-accessible-textbook-v1";
const CENTER_KEY = "sologsb-1009-service-center-v1";
const CENTER_LATENCY_MS = 600;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function createSeedProject(): ChapterProject {
  const blocks: ContentBlock[] = [
    {
      id: "block-h1",
      type: "heading",
      headingLevel: 1,
      text: "第三章 水循环与城市",
      accessibleText: "第三章 水循环与城市",
      changeReason: "",
      reviewStatus: "approved",
      comments: [],
    },
    {
      id: "block-p1",
      type: "paragraph",
      text: "城市中的水并非取之不尽，由于其会通过蒸发、降水以及地表径流等若干复杂过程在自然界中持续循环，因此理解这些过程对于建设具有韧性的城市具有十分重要的意义。",
      accessibleText: "城市里的水会不断循环。它经过蒸发、降水并沿地面流动。了解这些过程，可以帮助我们建设更能适应变化的城市。",
      changeReason: "拆分长句，把抽象表述改为更直接的说明。",
      reviewStatus: "pending",
      comments: [],
    },
    {
      id: "block-h2",
      type: "heading",
      headingLevel: 2,
      text: "一、水从哪里来",
      accessibleText: "一、水从哪里来",
      changeReason: "保留原章节结构。",
      reviewStatus: "approved",
      comments: [],
    },
    {
      id: "block-img",
      type: "image",
      text: "图 3-1 城市水循环示意",
      imageSrc: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='420'%3E%3Crect width='800' height='420' fill='%23dcecf3'/%3E%3Ccircle cx='650' cy='85' r='45' fill='%23f4c95d'/%3E%3Cpath d='M0 300 Q180 240 340 300 T800 280 V420 H0Z' fill='%2389b7d0'/%3E%3Cpath d='M130 285 Q220 170 330 285' fill='none' stroke='%233a7c9e' stroke-width='12'/%3E%3C/svg%3E",
      imageAlt: "",
      accessibleText: "",
      changeReason: "",
      reviewStatus: "needs-work",
      comments: [],
    },
    {
      id: "block-p2",
      type: "paragraph",
      text: "当太阳照射到水面时，水会受热变成水蒸气升到空中。水蒸气冷却后形成云，再以雨或雪的形式落回地面。",
      accessibleText: "太阳照在水面上，水会变成水蒸气升到空中。水蒸气冷却后变成云，最后以雨或雪落回地面。",
      changeReason: "使用较短句子，并明确每个步骤的先后顺序。",
      reviewStatus: "approved",
      comments: [],
    },
    {
      id: "block-link",
      type: "link",
      text: "点击这里",
      linkHref: "/resources/water-cycle",
      accessibleText: "打开水循环互动实验",
      changeReason: "改为说明链接目标的独立文案。",
      reviewStatus: "pending",
      comments: [],
    },
    {
      id: "block-h3",
      type: "heading",
      headingLevel: 3,
      text: "雨水花园怎样工作",
      accessibleText: "雨水花园怎样工作",
      changeReason: "",
      reviewStatus: "approved",
      comments: [],
    },
    {
      id: "block-p3",
      type: "paragraph",
      text: "雨水花园利用土壤和植物的共同作用暂时储存雨水，同时通过下渗补给地下水，并在降雨较集中时减轻城市排水管道所承受的压力。",
      accessibleText: "雨水花园用土壤和植物暂时存住雨水。雨水还会慢慢渗入地下，补充地下水。雨很大时，它可以减轻排水管的压力。",
      changeReason: "把并列成分拆成短句，减少专业术语密度。",
      reviewStatus: "pending",
      comments: [],
    },
  ];

  return {
    id: "accessible-textbook-1009",
    title: "科学（五年级下册）·无障碍改写稿",
    subject: "科学",
    grade: "五年级",
    blocks,
    glossary: [
      { id: "term-1", source: "水循环", preferred: "水循环", note: "全书统一使用" },
      { id: "term-2", source: "地表径流", preferred: "沿地面流动的水", note: "首次出现时使用通俗解释" },
      { id: "term-3", source: "下渗", preferred: "渗入地下", note: "避免单独使用专业词" },
    ],
    navTable: {
      status: "confirmed",
      updatedAt: new Date().toISOString(),
      entries: blocks.map((block, index) => ({
        id: `seed-nav-${index + 1}`,
        blockId: block.id,
        order: index + 1,
        section: (() => {
          const sections = sectionForBlocks(blocks);
          return sections[index];
        })(),
        label: blockLabel(block),
        role: blockRole(block),
        status: "active" as NavEntryStatus,
      })),
    },
    versions: [],
    updatedAt: new Date().toISOString(),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseImportedChapter(input: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push(blankBlock("heading", heading[2], { headingLevel: heading[1].length }));
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)]+)\)(?:\s+(.+))?$/.exec(line);
    if (image) {
      blocks.push(blankBlock("image", image[3] || "未命名图片", { imageSrc: image[2], imageAlt: image[1] }));
      continue;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(line);
    if (link) {
      blocks.push(blankBlock("link", link[1], { linkHref: link[2] }));
      continue;
    }
    blocks.push(blankBlock("paragraph", line));
  }
  return blocks.length ? blocks : [blankBlock("paragraph", input.trim() || "请输入章节内容")];
}

function blankBlock(type: BlockType, text: string, extra: Partial<ContentBlock> = {}): ContentBlock {
  return {
    id: uid("block"),
    type,
    text,
    accessibleText: type === "image" ? extra.imageAlt ?? "" : text,
    changeReason: "",
    reviewStatus: "pending",
    comments: [],
    ...extra,
  };
}

function blockLabel(block: ContentBlock) {
  if (block.type === "image") return block.imageAlt || block.accessibleText || block.text || "（图片，暂无替代文本）";
  return block.accessibleText || block.text || "（空）";
}

/** 某一级标题是否开启新分节：H1/H2 划分朗读分节，H3 及以下归入当前分节 */
function startsSection(level: number) {
  return level <= 2;
}

function sectionForBlocks(blocks: ContentBlock[]) {
  const sections: string[] = [];
  let current = "开篇";
  for (const block of blocks) {
    if (block.type === "heading" && startsSection(block.headingLevel ?? 2)) {
      current = block.accessibleText || block.text;
    }
    sections.push(current);
  }
  return sections;
}

function createDraftNavTable(blocks: ContentBlock[]): NavigationTable {
  const sections = sectionForBlocks(blocks);
  return {
    status: "draft",
    updatedAt: new Date().toISOString(),
    entries: blocks.map((block, index) => ({
      id: uid("nav"),
      blockId: block.id,
      order: index + 1,
      section: sections[index],
      label: blockLabel(block),
      role: blockRole(block),
      status: "active",
    })),
  };
}

/**
 * 编辑侧与导航表对账：
 * - 块还在：条目跟着块走（顺序、分节按现有内容重算），状态保留；
 * - 块已删除：对应条目挂起，保留旧编号与分节，等服务中心确认；
 * - 新增的块：补一条待确认初稿条目。
 */
function reconcileNavTable(table: NavigationTable, blocks: ContentBlock[]): void {
  const sections = sectionForBlocks(blocks);
  const active = table.entries.filter((entry) => blocks.some((block) => block.id === entry.blockId));
  const suspended = table.entries.filter((entry) => !active.some((item) => item.id === entry.id));

  for (const entry of active) {
    const index = blocks.findIndex((block) => block.id === entry.blockId);
    const block = blocks[index];
    if (entry.status === "suspended") {
      // 块重新出现（如撤销删除）：挂起条目回到编排，撤销/重做也安全
      entry.status = "active";
      delete entry.formerOrder;
      delete entry.suspendedAt;
      entry.note = "块已恢复，挂起条目重新参与编排。";
    }
    if (entry.status === "active") {
      entry.order = index + 1;
      entry.section = sections[index];
      entry.label = blockLabel(block);
      entry.role = blockRole(block);
    }
  }
  for (const entry of suspended) {
    if (entry.status !== "suspended") {
      entry.status = "suspended";
      entry.formerOrder = entry.order;
      entry.note = `原块“${entry.label}”已从编辑稿删除，等待服务中心确认后再排。`;
      entry.suspendedAt = new Date().toISOString();
    }
  }

  active.sort((a, b) => {
    const ia = blocks.findIndex((block) => block.id === a.blockId);
    const ib = blocks.findIndex((block) => block.id === b.blockId);
    return ia - ib;
  });
  for (const [index, block] of blocks.entries()) {
    if (!active.some((entry) => entry.blockId === block.id)) {
      active.push({
        id: uid("nav"),
        blockId: block.id,
        order: index + 1,
        section: sections[index],
        label: blockLabel(block),
        role: blockRole(block),
        status: "active",
        note: "编辑新增内容块，待服务中心确认编排。",
      });
    }
  }
  active.sort((a, b) => blocks.findIndex((block) => block.id === a.blockId) - blocks.findIndex((block) => block.id === b.blockId));
  for (const [index, entry] of active.entries()) entry.order = index + 1;
  table.entries = [...active, ...suspended];
  table.updatedAt = new Date().toISOString();
}

function sentenceLength(text: string) {
  const normalized = text.replace(/\s+/g, "");
  return /[A-Za-z]/.test(text) ? text.trim().split(/\s+/).length : normalized.length;
}

function analyze(project: ChapterProject): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  let lastHeading = 0;
  for (const block of project.blocks) {
    if (block.type === "heading") {
      const level = block.headingLevel ?? 2;
      if (lastHeading && level > lastHeading + 1) {
        issues.push({
          id: `heading-${block.id}`,
          blockId: block.id,
          type: "heading",
          severity: "error",
          title: "标题层级跳跃",
          detail: `从 H${lastHeading} 直接到 H${level}，读屏用户会失去清晰的章节结构。`,
          suggestion: `改为 H${lastHeading + 1}，或补上中间的上级标题。`,
        });
      }
      lastHeading = level;
    }
    if (block.type === "image" && !(block.imageAlt ?? block.accessibleText).trim()) {
      issues.push({
        id: `image-${block.id}`,
        blockId: block.id,
        type: "image",
        severity: "error",
        title: "图片缺少替代文本",
        detail: "视觉用户能看到的图表信息，读屏用户目前无法获得。",
        suggestion: "说明图中主体、变化和结论；纯装饰图片应标记为空替代文本。",
      });
    }
    if (block.type === "link") {
      const label = block.accessibleText || block.text;
      if (/^(点击这里|这里|链接|更多|here|click here|read more)$/i.test(label.trim())) {
        issues.push({
          id: `link-${block.id}`,
          blockId: block.id,
          type: "link",
          severity: "error",
          title: "链接文案缺少目的",
          detail: `“${label}”单独朗读时无法说明会前往哪里。`,
          suggestion: "改成“打开水循环互动实验”等可独立理解的文案。",
        });
      }
    }
    const text = block.type === "image" ? block.text : block.text;
    const sentences = text.split(/(?<=[。！？!?])\s*/).filter(Boolean);
    for (const [index, sentence] of sentences.entries()) {
      if (sentenceLength(sentence) > (/[A-Za-z]/.test(sentence) ? 28 : 42)) {
        issues.push({
          id: `sentence-${block.id}-${index}`,
          blockId: block.id,
          type: "sentence",
          severity: "warning",
          title: "句子过长",
          detail: `该句约 ${sentenceLength(sentence)} ${/[A-Za-z]/.test(sentence) ? "个词" : "个字"}，一次理解的信息较多。`,
          suggestion: "按动作或因果关系拆成 2—3 个短句。",
        });
      }
    }
    const source = `${block.text} ${block.accessibleText}`;
    for (const term of project.glossary) {
      if (source.includes(term.source) && block.accessibleText && !block.accessibleText.includes(term.preferred)) {
        issues.push({
          id: `term-${block.id}-${term.id}`,
          blockId: block.id,
          type: "glossary",
          severity: "info",
          title: `术语“${term.source}”尚未统一`,
          detail: `全书建议表述为“${term.preferred}”。${term.note}`,
          suggestion: `将无障碍文本调整为“${term.preferred}”。`,
        });
      }
    }
  }
  return issues;
}

function simplifyText(input: string, glossary: GlossaryTerm[]) {
  let result = input
    .replaceAll("由于其", "因为")
    .replaceAll("因此", "所以")
    .replaceAll("具有十分重要的意义", "很重要")
    .replaceAll("利用", "使用")
    .replaceAll("共同作用", "一起作用")
    .replaceAll("暂时储存", "暂时存住")
    .replaceAll("所承受的压力", "受到的压力")
    .replace(/([^。！？]{38,}?)[，、]([^。！？]{12,}?[。！？])/g, "$1。$2");
  for (const term of glossary) {
    if (result.includes(term.source)) result = result.replaceAll(term.source, term.preferred);
  }
  result = result
    .split(/(?<=[。！？!?])\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .join("\n");
  return result;
}

function blockRole(block: ContentBlock) {
  if (block.type === "heading") return `H${block.headingLevel ?? 2} 标题`;
  if (block.type === "image") return "图片 / 替代文本";
  if (block.type === "link") return "链接";
  return "正文段落";
}

function statusLabel(status: ReviewStatus) {
  if (status === "approved") return "已通过";
  if (status === "needs-work") return "需修改";
  return "待审核";
}

function severityLabel(severity: Severity) {
  if (severity === "error") return "必须修复";
  if (severity === "warning") return "建议优化";
  return "一致性提醒";
}

function exportHtml(project: ChapterProject) {
  const body = project.blocks.map((block) => {
    if (block.type === "heading") {
      const level = Math.min(6, Math.max(1, block.headingLevel ?? 2));
      return `<h${level}>${escapeHtml(block.accessibleText || block.text)}</h${level}>`;
    }
    if (block.type === "image") {
      return `<figure><img src="${escapeHtml(block.imageSrc ?? "")}" alt="${escapeHtml(block.imageAlt || block.accessibleText)}"><figcaption>${escapeHtml(block.text)}</figcaption></figure>`;
    }
    if (block.type === "link") {
      return `<p><a href="${escapeHtml(block.linkHref ?? "#")}">${escapeHtml(block.accessibleText || block.text)}</a></p>`;
    }
    return `<p>${escapeHtml(block.accessibleText || block.text)}</p>`;
  }).join("\n      ");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(project.title)} · 无障碍版本</title>
  <style>
    :root { font-family: "Noto Sans SC", sans-serif; font-size: 20px; line-height: 1.85; color: #17231f; background: #fffdf7; }
    body { max-width: 760px; margin: 0 auto; padding: 32px 24px 80px; }
    a { color: #075c9d; text-decoration-thickness: 2px; text-underline-offset: 3px; }
    a:focus-visible, [tabindex]:focus-visible { outline: 4px solid #d08a00; outline-offset: 3px; }
    h1, h2, h3, h4, h5, h6 { line-height: 1.4; margin-top: 1.8em; }
    figure { margin: 2em 0; } img { max-width: 100%; height: auto; } figcaption { font-size: .86em; color: #46554f; }
    .skip { position: absolute; left: -9999px; } .skip:focus { position: static; display: inline-block; padding: .5em; background: #fff; }
  </style>
</head>
<body>
  <a class="skip" href="#main">跳到正文</a>
  <main id="main" tabindex="-1">
      ${body}
  </main>
</body>
</html>`;
}

function download(filename: string, content: string, type = "text/html;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function loadProject(): ChapterProject {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "") as { schema: number; project: ChapterProject };
    if ((stored.schema === 1 || stored.schema === 2) && stored.project?.blocks?.length) {
      // 旧稿没有朗读导航表：升级时按内容块现有顺序补一份待确认初稿
      if (!stored.project.navTable) {
        stored.project.navTable = createDraftNavTable(stored.project.blocks);
      }
      return stored.project;
    }
  } catch {
    // Fall back to the bundled sample.
  }
  return createSeedProject();
}

/**
 * 无障碍服务中心（模拟）。中心侧用独立的 localStorage 键保存，
 * 与编辑稿互不影响：中心拉取失败时编辑侧仍可照常修改。
 */
type CenterSyncState = "synced" | "pull-failed" | "request-failed" | "no-record" | "pulling" | "idle";

function centerRead(): CenterRecord | null {
  try {
    return JSON.parse(localStorage.getItem(CENTER_KEY) ?? "null") as CenterRecord | null;
  } catch {
    return null;
  }
}

function centerWrite(record: CenterRecord) {
  localStorage.setItem(CENTER_KEY, JSON.stringify(record));
}

function seedCenterIfEmpty(project: ChapterProject) {
  if (localStorage.getItem(CENTER_KEY) !== null) return;
  const table = project.navTable;
  if (!table || table.status !== "confirmed") return;
  centerWrite({
    projectId: project.id,
    updatedAt: table.updatedAt,
    entries: table.entries
      .filter((entry) => entry.status === "active")
      .map((entry) => ({ blockId: entry.blockId, order: entry.order, section: entry.section, label: entry.label, role: entry.role })),
  });
}

/** 模拟一次中心网络请求；勾选“模拟中心不可用”时稳定失败 */
function centerRequest<T>(label: string, task: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (centerOffline) reject(new Error(`${label}失败：服务中心暂时不可用，仅重试中心侧即可，编辑稿可继续修改。`));
      else {
        try {
          resolve(task());
        } catch (error) {
          reject(error);
        }
      }
    }, CENTER_LATENCY_MS);
  });
}

/**
 * 用中心侧导航表与编辑稿对账：
 * - 对得上的条目跟随编辑稿的块位置与分节，保持“已确认”；
 * - 中心有、编辑稿没有的块（如别处删图）→ 挂起待确认；
 * - 编辑稿新增的块 → 初稿条目；中心无记录时整份保持为待确认初稿。
 */
function mergeCenterTable(projectDraft: ChapterProject, center: CenterRecord): void {
  const blocks = projectDraft.blocks;
  const sections = sectionForBlocks(blocks);
  const existing = projectDraft.navTable;
  // 本地已有导航表（含待确认初稿）：以编辑稿为准重新对账，中心只负责确认与挂起裁决
  if (existing) {
    reconcileNavTable(existing, blocks);
    return;
  }

  const entries: NavEntry[] = center.entries.map((centerEntry, index) => {
    const blockIndex = blocks.findIndex((block) => block.id === centerEntry.blockId);
    if (blockIndex >= 0) {
      return {
        id: uid("nav"),
        blockId: centerEntry.blockId,
        order: blockIndex + 1,
        section: sections[blockIndex],
        label: blockLabel(blocks[blockIndex]),
        role: blockRole(blocks[blockIndex]),
        status: "active",
      };
    }
    return {
      id: uid("nav"),
      blockId: centerEntry.blockId,
      order: centerEntry.order,
      formerOrder: centerEntry.order,
      section: centerEntry.section,
      label: centerEntry.label,
      role: centerEntry.role,
      status: "suspended",
      note: `中心导航表指向的块（原编号 ${centerEntry.order}）不在当前编辑稿中，挂起待中心确认。`,
      suspendedAt: new Date().toISOString(),
    };
  });

  for (const [index, block] of blocks.entries()) {
    if (!entries.some((entry) => entry.status === "active" && entry.blockId === block.id)) {
      entries.push({
        id: uid("nav"),
        blockId: block.id,
        order: index + 1,
        section: sections[index],
        label: blockLabel(block),
        role: blockRole(block),
        status: "active",
        note: "编辑侧新增内容块，待服务中心确认编排。",
      });
    }
  }

  const table: NavigationTable = {
    status: "confirmed",
    updatedAt: new Date().toISOString(),
    entries: [],
  };
  projectDraft.navTable = table;
  table.entries = entries;
  reconcileNavTable(table, blocks);
}

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (!rootElement) throw new Error("Application root was not found");
const app: HTMLDivElement = rootElement;

let project = loadProject();
seedCenterIfEmpty(project);
let activeBlockId = project.blocks[0]?.id ?? "";
let activeIssueId = "";
let previewMode: "normal" | "assisted" = "normal";
let selectedVersionId = "";
let showGlossary = false;
let centerOffline = false;
let centerSync: CenterSyncState = "idle";
let centerMessage = "";
let centerBusyLabel = "";
let undoStack: ChapterProject[] = [];
let redoStack: ChapterProject[] = [];
let saveTimer = 0;

const activeBlock = () => project.blocks.find((block) => block.id === activeBlockId) ?? project.blocks[0];
const issues = () => analyze(project);
const suspendedEntries = () => project.navTable?.entries.filter((entry) => entry.status === "suspended") ?? [];

function saveSoon() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: 2, project }));
  }, 320);
}

function commit(label: string, update: (draft: ChapterProject) => void, renderAfter = true) {
  undoStack = [...undoStack.slice(-49), structuredClone(project)];
  redoStack = [];
  const draft = structuredClone(project);
  update(draft);
  // 编辑挪动内容块、改标题层级或删图片后，两边重新对账
  if (draft.navTable) reconcileNavTable(draft.navTable, draft.blocks);
  draft.updatedAt = new Date().toISOString();
  project = draft;
  document.documentElement.dataset.lastAction = label;
  saveSoon();
  if (renderAfter) render();
}

function undo() {
  const previous = undoStack.pop();
  if (!previous) return;
  redoStack = [structuredClone(project), ...redoStack].slice(0, 50);
  project = previous;
  if (project.navTable) reconcileNavTable(project.navTable, project.blocks);
  if (!project.blocks.some((block) => block.id === activeBlockId)) activeBlockId = project.blocks[0]?.id ?? "";
  saveSoon();
  render();
}

function redo() {
  const next = redoStack.shift();
  if (!next) return;
  undoStack = [...undoStack.slice(-49), structuredClone(project)];
  project = next;
  if (project.navTable) reconcileNavTable(project.navTable, project.blocks);
  saveSoon();
  render();
}

function updateActiveBlock(update: (block: ContentBlock, draft: ChapterProject) => void, label = "修改无障碍文本", renderAfter = true) {
  commit(label, (draft) => {
    const block = draft.blocks.find((item) => item.id === activeBlockId);
    if (block) update(block, draft);
  }, renderAfter);
}

let pendingCenterAction: null | (() => Promise<void>) = null;

async function runPendingCenterAction() {
  const action = pendingCenterAction;
  if (!action) return;
  await action();
}

async function pullFromCenter() {
  pendingCenterAction = pullFromCenter;
  centerSync = "pulling";
  centerBusyLabel = "";
  centerMessage = "";
  render();
  try {
    const center = await centerRequest("拉取导航表", () => centerRead());
    // 拉取失败只影响服务中心这侧；成功后两边重新对账，对得上的条目跟着编辑稿
    if (!center || !center.entries.length) {
      centerSync = "no-record";
    } else {
      mergeCenterTable(project, center);
      document.documentElement.dataset.lastAction = "拉取服务中心导航表并对账";
      saveSoon();
      centerSync = "synced";
    }
    pendingCenterAction = null;
    render();
  } catch (error) {
    centerSync = "pull-failed";
    centerMessage = error instanceof Error ? error.message : "服务中心拉取失败";
    render();
  }
}

async function submitDraftToCenter() {
  const table = project.navTable;
  if (!table || table.status !== "draft") return;
  pendingCenterAction = submitDraftToCenter;
  centerBusyLabel = "提交初稿";
  centerMessage = "";
  render();
  const snapshot = structuredClone(table);
  try {
    await centerRequest("提交待确认初稿", () => {
      centerWrite({
        projectId: project.id,
        updatedAt: new Date().toISOString(),
        entries: snapshot.entries
          .filter((entry) => entry.status === "active")
          .map((entry) => ({ blockId: entry.blockId, order: entry.order, section: entry.section, label: entry.label, role: entry.role })),
      });
    });
    commit("服务中心确认初稿", (draft) => {
      if (draft.navTable) draft.navTable.status = "confirmed";
    });
    centerSync = "synced";
    pendingCenterAction = null;
    centerBusyLabel = "";
    render();
  } catch (error) {
    centerSync = "request-failed";
    centerBusyLabel = "";
    centerMessage = error instanceof Error ? error.message : "服务中心请求失败";
    render();
  }
}

async function confirmSuspendedEntry(entryId: string, remapBlockId: string) {
  const entry = project.navTable?.entries.find((item) => item.id === entryId);
  if (!entry || entry.status !== "suspended") return;
  pendingCenterAction = () => confirmSuspendedEntry(entryId, remapBlockId);
  centerBusyLabel = "送服务中心确认挂起条目";
  centerMessage = "";
  render();
  const targetBlockId = remapBlockId || entry.blockId;
  try {
    await centerRequest("确认挂起导航条目", () => {
      const center = centerRead();
      if (center) {
        if (remapBlockId) {
          const block = project.blocks.find((item) => item.id === remapBlockId);
          if (block) {
            const sections = sectionForBlocks(project.blocks);
            const index = project.blocks.indexOf(block);
            const kept = center.entries.filter((item) => item.blockId !== entry.blockId);
            kept.push({ blockId: block.id, order: index + 1, section: sections[index], label: blockLabel(block), role: blockRole(block) });
            center.entries = kept;
          }
        } else {
          center.entries = center.entries.filter((item) => item.blockId !== targetBlockId);
        }
        center.updatedAt = new Date().toISOString();
        centerWrite(center);
      }
    });
    commit("挂起条目经服务中心确认后处理", (draft) => {
      const table = draft.navTable;
      if (!table) return;
      if (remapBlockId) {
        const target = table.entries.find((item) => item.id === entryId);
        const remapped = table.entries.some((item) => item.status === "active" && item.blockId === remapBlockId);
        if (target && !remapped) {
          target.blockId = remapBlockId;
          target.status = "active";
          target.note = "原挂起条目已改指新内容块，中心已确认。";
          delete target.formerOrder;
          delete target.suspendedAt;
        } else if (target) {
          table.entries = table.entries.filter((item) => item.id !== entryId);
        }
      } else {
        table.entries = table.entries.filter((item) => item.id !== entryId);
      }
    });
    centerSync = "synced";
    pendingCenterAction = null;
    centerBusyLabel = "";
    render();
  } catch (error) {
    centerSync = "request-failed";
    centerBusyLabel = "";
    centerMessage = error instanceof Error ? error.message : "服务中心请求失败";
    render();
  }
}

function render() {
  const list = issues();
  const active = activeBlock();
  const activeIssues = list.filter((issue) => issue.blockId === active.id);
  const approved = project.blocks.filter((block) => block.reviewStatus === "approved").length;
  const version = project.versions.find((item) => item.id === selectedVersionId) ?? project.versions[0];

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span>无障碍</span><b>1009</b></div>
        <div class="title-block">
          <input id="project-title" aria-label="教材名称" value="${escapeHtml(project.title)}" />
          <div class="meta"><span>${escapeHtml(project.subject)}</span><span>${escapeHtml(project.grade)}</span><span class="save-dot">本地自动保存</span></div>
        </div>
        <div class="top-actions">
          <span class="online-pill">${navigator.onLine ? "在线" : "离线可编辑"}</span>
          <sl-button size="small" variant="default" ${undoStack.length ? "" : "disabled"} data-action="undo">撤销</sl-button>
          <sl-button size="small" variant="default" ${redoStack.length ? "" : "disabled"} data-action="redo">重做</sl-button>
          <sl-button size="small" variant="default" data-action="glossary">术语表</sl-button>
          <sl-button size="small" variant="primary" data-action="save-version">保存版本</sl-button>
          <sl-button size="small" variant="success" data-action="export">导出无障碍 HTML</sl-button>
        </div>
      </header>

      <div class="progress-strip">
        <div class="progress-copy"><b>${approved}/${project.blocks.length}</b><span>内容块已审核通过</span></div>
        <div class="progress-bar"><i style="width:${Math.round((approved / Math.max(1, project.blocks.length)) * 100)}%"></i></div>
        <div class="issue-counts">
          <span class="error">${list.filter((issue) => issue.severity === "error").length} 必须修复</span>
          <span class="warning">${list.filter((issue) => issue.severity === "warning").length} 建议优化</span>
          <span class="info">${list.filter((issue) => issue.severity === "info").length} 术语提醒</span>
        </div>
      </div>

      <div class="workspace">
        <aside class="outline-panel">
          <div class="panel-title"><span>章节结构</span><sl-badge>${project.blocks.length} 块</sl-badge></div>
          <div class="block-list">
            ${project.blocks.map((block, index) => {
              const blockIssues = list.filter((issue) => issue.blockId === block.id);
              return `<div class="block-item ${block.id === active.id ? "active" : ""}" role="button" tabindex="0" aria-label="第 ${index + 1} 块：${blockRole(block)}，${escapeHtml(block.accessibleText || block.text || "空")}" data-action="select-block" data-block-id="${block.id}">
                <span class="block-order">${index + 1}</span>
                <span class="block-copy"><b>${block.type === "heading" ? `H${block.headingLevel}` : blockRole(block)}</b><span>${escapeHtml(block.accessibleText || block.text || "（空）")}</span></span>
                <i class="status-${block.reviewStatus}" title="${statusLabel(block.reviewStatus)}"></i>
                ${blockIssues.length ? `<em>${blockIssues.length}</em>` : ""}
                <span class="block-actions">
                  <button type="button" title="上移内容块" aria-label="上移内容块" data-action="move-block" data-block-id="${block.id}" data-direction="up" ${index === 0 ? "disabled" : ""}>↑</button>
                  <button type="button" title="下移内容块" aria-label="下移内容块" data-action="move-block" data-block-id="${block.id}" data-direction="down" ${index === project.blocks.length - 1 ? "disabled" : ""}>↓</button>
                  ${block.type === "image" ? `<button type="button" class="danger" title="删除图片（导航条目将挂起）" aria-label="删除图片" data-action="delete-block" data-block-id="${block.id}">删图</button>` : ""}
                </span>
              </div>`;
            }).join("")}
          </div>
          <input id="chapter-file" type="file" accept=".txt,.md,.markdown" hidden />
          <sl-button class="import-button" variant="default" data-action="import">导入章节文本</sl-button>
          <div class="keyboard-note"><b>键盘</b><span><kbd>J</kbd><kbd>K</kbd> 跳转问题</span><span><kbd>E</kbd> 自动改写</span><span><kbd>⌘ Z</kbd> 撤销</span><span><kbd>1</kbd><kbd>2</kbd> 预览模式</span></div>
        </aside>

        <main class="editor-panel">
          <div class="editor-head">
            <div><span class="eyebrow">当前内容块</span><h1>${blockRole(active)}</h1></div>
            <div class="review-actions">
              <sl-button size="small" variant="${active.reviewStatus === "approved" ? "success" : "default"}" data-action="approve">${active.reviewStatus === "approved" ? "✓ 已通过" : "审核通过"}</sl-button>
              <sl-button size="small" variant="${active.reviewStatus === "needs-work" ? "danger" : "default"}" data-action="needs-work">需修改</sl-button>
            </div>
          </div>

          ${activeIssues.length ? `<div class="active-issues">${activeIssues.map((issue) => `
            <div class="issue-card ${issue.severity}">
              <div><sl-badge variant="${issue.severity === "error" ? "danger" : issue.severity === "warning" ? "warning" : "primary"}">${severityLabel(issue.severity)}</sl-badge><strong>${escapeHtml(issue.title)}</strong></div>
              <p>${escapeHtml(issue.detail)}</p><small>${escapeHtml(issue.suggestion)}</small>
            </div>`).join("")}</div>` : `<div class="issue-clear">✓ 当前内容块没有新的无障碍问题</div>`}

          <section class="edit-card source-card">
            <div class="section-heading"><div><span class="eyebrow">原教材</span><h2>${active.type === "image" ? "图片信息" : active.type === "link" ? "链接信息" : "原文"}</h2></div><sl-badge variant="neutral">${active.type}</sl-badge></div>
            ${renderSourceEditor(active)}
          </section>

          <section class="edit-card rewrite-card">
            <div class="section-heading">
              <div><span class="eyebrow">Accessible rewrite</span><h2>无障碍表达</h2></div>
              <sl-button size="small" variant="primary" outline data-action="generate">生成易读版本</sl-button>
            </div>
            ${renderAccessibleEditor(active)}
            <label class="field-label" for="reason-${active.id}">改写原因（每处改写必须记录）</label>
            <sl-textarea id="reason-${active.id}" data-field="reason" rows="2" value="${escapeHtml(active.changeReason)}" placeholder="例如：拆分长句、替换专业表达、补充链接目的"></sl-textarea>
          </section>

          <section class="edit-card">
            <div class="section-heading"><div><span class="eyebrow">Review discussion</span><h2>批注与回复</h2></div><sl-badge variant="warning">${active.comments.length} 条</sl-badge></div>
            <div class="comment-compose"><sl-textarea id="new-comment" rows="2" placeholder="记录改写依据、审核意见或术语讨论…"></sl-textarea><sl-button size="small" variant="primary" data-action="add-comment">添加批注</sl-button></div>
            <div class="comment-list">
              ${active.comments.length ? active.comments.map((comment) => `
                <article class="comment ${comment.resolved ? "resolved" : ""}">
                  <header><b>${escapeHtml(comment.author)}</b><time>${new Date(comment.createdAt).toLocaleString()}</time></header>
                  <p>${escapeHtml(comment.body)}</p>
                  ${comment.replies.map((reply) => `<div class="reply"><b>${escapeHtml(reply.author)}</b><span>${escapeHtml(reply.body)}</span></div>`).join("")}
                  <div class="reply-row"><sl-input size="small" id="reply-${comment.id}" placeholder="回复…"></sl-input><sl-button size="small" data-action="reply" data-comment-id="${comment.id}">回复</sl-button><sl-button size="small" variant="text" data-action="resolve-comment" data-comment-id="${comment.id}">${comment.resolved ? "重新打开" : "解决"}</sl-button></div>
                </article>`).join("") : `<div class="empty-note">当前内容块还没有批注。</div>`}
            </div>
          </section>
        </main>

        <aside class="review-panel">
          <section class="nav-card">
            <div class="section-heading">
              <div><span class="eyebrow">Service center · Reading navigation</span><h2>朗读导航表</h2></div>
              <sl-badge variant="${project.navTable?.status === "confirmed" ? "success" : "warning"}">${project.navTable?.status === "confirmed" ? "中心已确认" : "待确认初稿"}</sl-badge>
            </div>
            <div class="nav-sync ${centerSync === "pull-failed" || centerSync === "request-failed" ? "error" : centerSync === "synced" ? "ok" : ""}">
              ${renderNavSync()}
            </div>
            ${project.navTable?.status === "draft" ? `<div class="nav-banner">旧稿没有朗读导航表，已按内容块现有顺序补出待确认初稿；中心确认后生效。</div>` : ""}
            <ol class="nav-entries">
              ${(project.navTable?.entries.filter((entry) => entry.status === "active") ?? []).map((entry) => {
                const block = project.blocks.find((item) => item.id === entry.blockId);
                return `<li class="${block?.id === active.id ? "active" : ""}" data-action="select-block" data-block-id="${entry.blockId}" role="button" tabindex="0">
                  <b>${entry.order}</b>
                  <div><strong>${escapeHtml(entry.role)}</strong><span>${escapeHtml(entry.label)}</span><small class="nav-section">分节：${escapeHtml(entry.section)}</small>${entry.note ? `<small class="nav-note">${escapeHtml(entry.note)}</small>` : ""}</div>
                </li>`;
              }).join("")}
            </ol>
            ${renderSuspendedEntries()}
            <div class="nav-toolbar">
              <sl-button size="small" variant="primary" outline data-action="pull-nav" ${centerBusyLabel ? "disabled" : ""}>${centerSync === "pulling" ? "拉取中…" : "重新拉取导航表"}</sl-button>
              ${project.navTable?.status === "draft" ? `<sl-button size="small" variant="primary" data-action="submit-draft" ${centerBusyLabel ? "disabled" : ""}>${centerSync === "pulling" || centerBusyLabel === "提交初稿" ? "提交中…" : "提交初稿给中心确认"}</sl-button>` : ""}
              <label class="offline-toggle"><input type="checkbox" data-field="center-offline" ${centerOffline ? "checked" : ""}><span>模拟中心不可用</span></label>
            </div>
          </section>

          <section class="preview-card">
            <div class="section-heading"><div><span class="eyebrow">Reader preview</span><h2>阅读预览</h2></div><div class="mode-switch"><button class="${previewMode === "normal" ? "active" : ""}" data-action="preview-normal">普通</button><button class="${previewMode === "assisted" ? "active" : ""}" data-action="preview-assisted">辅助</button></div></div>
            <div class="reader-preview mode-${previewMode}">${renderPreview()}</div>
          </section>

          <section class="order-card">
            <div class="section-heading"><div><span class="eyebrow">Screen reader order</span><h2>读屏阅读顺序</h2></div><sl-badge>从上到下</sl-badge></div>
            <ol class="reading-order">
              ${project.blocks.map((block, index) => `<li class="${block.id === active.id ? "active" : ""}"><b>${index + 1}</b><div><strong>${blockRole(block)}</strong><span>${escapeHtml(block.accessibleText || block.text || "（无内容）")}</span></div></li>`).join("")}
            </ol>
          </section>

          <section class="issues-panel">
            <div class="section-heading"><div><span class="eyebrow">All checks</span><h2>全章问题</h2></div><sl-button size="small" variant="default" outline data-action="approve-all">全部通过</sl-button></div>
            <div class="issue-list">
              ${list.length ? list.map((issue) => `<button class="${issue.id === activeIssueId ? "active" : ""} ${issue.severity}" data-action="jump-issue" data-issue-id="${issue.id}" data-block-id="${issue.blockId}"><span>${severityLabel(issue.severity)}</span><b>${escapeHtml(issue.title)}</b><small>段 ${project.blocks.findIndex((block) => block.id === issue.blockId) + 1} · ${escapeHtml(issue.suggestion)}</small></button>`).join("") : `<div class="issue-clear">✓ 全章检查通过</div>`}
            </div>
          </section>

          <section class="version-card">
            <div class="section-heading"><div><span class="eyebrow">Version compare</span><h2>版本比较</h2></div><sl-badge>${project.versions.length} 版</sl-badge></div>
            ${project.versions.length ? `
              <sl-select id="version-select" size="small" value="${version?.id ?? ""}">${project.versions.map((item) => `<sl-option value="${item.id}">${escapeHtml(item.label)} · ${new Date(item.createdAt).toLocaleTimeString()}</sl-option>`).join("")}</sl-select>
              <div class="version-diff">${version ? renderVersionDiff(version, active) : ""}</div>
            ` : `<div class="empty-note">保存版本后，可比较改写前后的无障碍文本。</div>`}
          </section>
        </aside>
      </div>

      <footer class="statusbar"><span>最近操作：${escapeHtml(document.documentElement.dataset.lastAction || "示例章节已载入")}</span><span>${project.blocks.length} 个内容块 · ${list.length} 个待处理问题</span></footer>
    </div>

    <sl-dialog label="全书术语表" ${showGlossary ? "open" : ""} data-dialog="glossary">
      <div class="glossary-editor">
        ${project.glossary.map((term) => `<div class="term-row"><div><b>${escapeHtml(term.source)}</b><sl-input size="small" value="${escapeHtml(term.preferred)}" data-term-id="${term.id}"></sl-input><small>${escapeHtml(term.note)}</small></div><sl-button size="small" variant="danger" outline data-action="remove-term" data-term-id="${term.id}">删除</sl-button></div>`).join("")}
      </div>
      <div class="term-add"><sl-input id="new-term-source" placeholder="原文术语"></sl-input><sl-input id="new-term-preferred" placeholder="统一表达"></sl-input><sl-button variant="primary" data-action="add-term">添加术语</sl-button></div>
      <sl-button slot="footer" variant="primary" data-action="close-glossary">完成</sl-button>
    </sl-dialog>`;

  wireLiveFields();
}

function renderSourceEditor(block: ContentBlock) {
  if (block.type === "image") {
    return `<div class="image-source"><img src="${escapeHtml(block.imageSrc ?? "")}" alt="" /><div><b>图注</b><p>${escapeHtml(block.text)}</p><b>现有替代文本</b><p>${escapeHtml(block.imageAlt || "（空）")}</p></div></div>
      <sl-input id="source-${block.id}" data-field="source" label="图注" value="${escapeHtml(block.text)}"></sl-input>
      <sl-input id="image-alt-${block.id}" data-field="image-alt" label="替代文本" value="${escapeHtml(block.imageAlt ?? "")}" help-text="描述图片传达的信息，不写“图片”二字。"></sl-input>`;
  }
  if (block.type === "link") {
    return `<sl-input id="source-${block.id}" data-field="source" label="原链接文案" value="${escapeHtml(block.text)}"></sl-input><sl-input id="link-href-${block.id}" data-field="link-href" label="链接地址" value="${escapeHtml(block.linkHref ?? "")}"></sl-input>`;
  }
  if (block.type === "heading") {
    return `<div class="heading-edit"><sl-select id="heading-level-${block.id}" data-field="heading-level" label="标题层级" value="${String(block.headingLevel ?? 2)}"><sl-option value="1">H1</sl-option><sl-option value="2">H2</sl-option><sl-option value="3">H3</sl-option><sl-option value="4">H4</sl-option></sl-select><sl-input id="source-${block.id}" data-field="source" label="标题文本" value="${escapeHtml(block.text)}"></sl-input></div>`;
  }
  return `<sl-textarea id="source-${block.id}" data-field="source" rows="4" value="${escapeHtml(block.text)}"></sl-textarea>`;
}

function renderAccessibleEditor(block: ContentBlock) {
  if (block.type === "image") {
    return `<sl-textarea id="accessible-${block.id}" data-field="accessible" rows="3" label="图片替代文本" value="${escapeHtml(block.imageAlt || block.accessibleText)}" help-text="读屏软件会朗读这里的内容。"></sl-textarea>`;
  }
  return `<sl-textarea id="accessible-${block.id}" data-field="accessible" rows="6" value="${escapeHtml(block.accessibleText)}"></sl-textarea>`;
}

function renderPreview() {
  return project.blocks.map((block, index) => {
    const content = escapeHtml(block.accessibleText || block.text);
    if (block.type === "heading") {
      const tag = `h${Math.min(6, Math.max(1, block.headingLevel ?? 2))}`;
      return `<${tag} class="${block.id === activeBlockId ? "active-block" : ""}"><span class="order-marker">${index + 1}</span>${content}</${tag}>`;
    }
    if (block.type === "image") {
      return `<figure class="${block.id === activeBlockId ? "active-block" : ""}"><img src="${escapeHtml(block.imageSrc ?? "")}" alt="${escapeHtml(block.imageAlt || block.accessibleText)}"><figcaption><span class="order-marker">${index + 1}</span>${escapeHtml(block.text)}</figcaption></figure>`;
    }
    if (block.type === "link") {
      return `<p class="${block.id === activeBlockId ? "active-block" : ""}"><span class="order-marker">${index + 1}</span><a href="${escapeHtml(block.linkHref ?? "#")}" onclick="return false">${content}</a><span class="link-role">链接</span></p>`;
    }
    return `<p class="${block.id === activeBlockId ? "active-block" : ""}"><span class="order-marker">${index + 1}</span>${content}</p>`;
  }).join("");
}

function renderVersionDiff(version: VersionSnapshot, current: ContentBlock) {
  const oldBlock = version.blocks.find((block) => block.id === current.id);
  if (!oldBlock) return `<div class="empty-note">当前内容块不在该版本中。</div>`;
  return `<div class="diff-column"><span>旧版</span><p>${escapeHtml(oldBlock.accessibleText || oldBlock.text)}</p></div><div class="diff-column current"><span>当前</span><p>${escapeHtml(current.accessibleText || current.text)}</p></div>`;
}

function renderNavSync() {
  const activeCount = project.navTable?.entries.filter((entry) => entry.status === "active").length ?? 0;
  const suspendedCount = suspendedEntries().length;
  const summary = `<div class="nav-summary"><span>${activeCount} 条在编</span><span>${suspendedCount} 条挂起</span><small>更新于 ${new Date(project.navTable?.updatedAt ?? Date.now()).toLocaleTimeString()}</small></div>`;
  if (centerSync === "pulling") return `${summary}<p class="nav-message">正在从服务中心拉取导航表……</p>`;
  if (centerBusyLabel) return `${summary}<p class="nav-message">${escapeHtml(centerBusyLabel)}……</p>`;
  if (centerSync === "pull-failed") return `${summary}<p class="nav-message">${escapeHtml(centerMessage)}</p><sl-button size="small" variant="danger" outline data-action="retry-center">只重试服务中心</sl-button><p class="nav-hint">编辑稿不受影响，可继续改写、挪动内容块。</p>`;
  if (centerSync === "request-failed") return `${summary}<p class="nav-message">${escapeHtml(centerMessage)}</p><sl-button size="small" variant="danger" outline data-action="retry-center">重试服务中心</sl-button>`;
  if (centerSync === "synced") return `${summary}<p class="nav-message ok">服务中心导航表已同步（${new Date().toLocaleTimeString()}）</p>`;
  if (centerSync === "no-record") return `${summary}<p class="nav-message">服务中心还没有这一章的导航表，请提交待确认初稿。</p>`;
  return `${summary}<p class="nav-message muted">本地对账会随编辑自动进行；需要时可向服务中心重新拉取。</p>`;
}

function renderSuspendedEntries() {
  const suspended = suspendedEntries();
  if (!suspended.length) return "";
  return `<div class="nav-suspended">
    <div class="suspended-head"><b>挂起 · 待服务中心确认</b><sl-badge variant="danger">${suspended.length}</sl-badge></div>
    ${suspended.map((entry) => `
      <div class="suspended-row">
        <div class="suspended-copy"><s>#${entry.formerOrder ?? entry.order}</s><strong>${escapeHtml(entry.role)}</strong><span>${escapeHtml(entry.label)}</span><small>${escapeHtml(entry.note ?? "")}</small></div>
        <div class="suspended-confirm">
          <select data-field="remap" data-entry-id="${entry.id}" aria-label="为挂起条目选择新的内容块">
            <option value="">从导航表移除</option>
            ${project.blocks.map((block) => `<option value="${block.id}">改指：${escapeHtml(blockLabel(block).slice(0, 18))}</option>`).join("")}
          </select>
          <sl-button size="small" variant="default" data-action="confirm-suspended" data-entry-id="${entry.id}" ${centerBusyLabel ? "disabled" : ""}>送中心确认</sl-button>
        </div>
      </div>`).join("")}
  </div>`;
}

function wireLiveFields() {
  app.querySelectorAll<HTMLElement>("sl-input[data-field], sl-textarea[data-field], sl-select[data-field]").forEach((element) => {
    element.addEventListener("sl-input", () => {
      const value = (element as HTMLElement & { value: string }).value;
      updateActiveBlock((block) => {
        const field = element.dataset.field;
        if (field === "source") block.text = value;
        if (field === "accessible") {
          block.accessibleText = value;
          if (block.type === "image") block.imageAlt = value;
        }
        if (field === "image-alt") {
          block.imageAlt = value;
          block.accessibleText = value;
        }
        if (field === "link-href") block.linkHref = value;
        if (field === "reason") block.changeReason = value;
        block.reviewStatus = "pending";
      }, "编辑无障碍文本", false);
    });
    element.addEventListener("sl-change", () => render());
  });
}

app.addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "undo") undo();
  if (action === "redo") redo();
  if (action === "select-block" && !target.closest(".block-actions")) {
    activeBlockId = target.dataset.blockId ?? activeBlockId;
    activeIssueId = "";
    render();
  }
  if (action === "move-block") {
    const blockId = target.dataset.blockId ?? "";
    const direction = target.dataset.direction === "down" ? 1 : -1;
    commit("挪动内容块，导航表重新对账", (draft) => {
      const index = draft.blocks.findIndex((block) => block.id === blockId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= draft.blocks.length) return;
      const [moved] = draft.blocks.splice(index, 1);
      draft.blocks.splice(targetIndex, 0, moved);
      activeBlockId = blockId;
    });
  }
  if (action === "delete-block") {
    const blockId = target.dataset.blockId ?? "";
    commit("删除图片，导航条目挂起待确认", (draft) => {
      const block = draft.blocks.find((item) => item.id === blockId);
      if (!block || block.type !== "image") return;
      draft.blocks = draft.blocks.filter((item) => item.id !== blockId);
      if (activeBlockId === blockId) activeBlockId = draft.blocks[0]?.id ?? "";
    });
  }
  if (action === "pull-nav") void pullFromCenter();
  if (action === "retry-center") void runPendingCenterAction();
  if (action === "submit-draft") void submitDraftToCenter();
  if (action === "confirm-suspended") {
    const entryId = target.dataset.entryId ?? "";
    const select = app.querySelector<HTMLSelectElement>(`select[data-entry-id="${CSS.escape(entryId)}"]`);
    void confirmSuspendedEntry(entryId, select?.value ?? "");
  }
  if (action === "jump-issue") {
    activeIssueId = target.dataset.issueId ?? "";
    activeBlockId = target.dataset.blockId ?? activeBlockId;
    render();
    requestAnimationFrame(() => app.querySelector<HTMLElement>(".editor-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  if (action === "generate") {
    const block = activeBlock();
    const suggestion = block.type === "link"
      ? "打开水循环互动实验"
      : simplifyText(block.type === "image" ? block.imageAlt || block.text : block.text, project.glossary);
    updateActiveBlock((current) => {
      if (current.type === "image") current.imageAlt = suggestion;
      current.accessibleText = suggestion;
      current.changeReason ||= "拆分长句并替换复杂表达，保留原有知识信息。";
      current.reviewStatus = "pending";
    }, "生成易读版本");
  }
  if (action === "approve") updateActiveBlock((block) => { block.reviewStatus = "approved"; }, "审核通过");
  if (action === "needs-work") updateActiveBlock((block) => { block.reviewStatus = "needs-work"; }, "标记需修改");
  if (action === "add-comment") {
    const input = app.querySelector<HTMLElement & { value: string }>("#new-comment");
    const body = input?.value.trim();
    if (body) updateActiveBlock((block) => {
      block.comments.unshift({ id: uid("comment"), author: "当前编辑", body, createdAt: new Date().toISOString(), resolved: false, replies: [] });
    }, "添加批注");
  }
  if (action === "reply") {
    const commentId = target.dataset.commentId ?? "";
    const input = app.querySelector<HTMLElement & { value: string }>(`#reply-${CSS.escape(commentId)}`);
    const body = input?.value.trim();
    if (body) updateActiveBlock((block) => {
      block.comments.find((comment) => comment.id === commentId)?.replies.push({ id: uid("reply"), author: "当前编辑", body, createdAt: new Date().toISOString() });
    }, "回复批注");
  }
  if (action === "resolve-comment") {
    const commentId = target.dataset.commentId ?? "";
    updateActiveBlock((block) => {
      const comment = block.comments.find((item) => item.id === commentId);
      if (comment) comment.resolved = !comment.resolved;
    }, "更新批注状态");
  }
  if (action === "preview-normal") { previewMode = "normal"; render(); }
  if (action === "preview-assisted") { previewMode = "assisted"; render(); }
  if (action === "glossary") { showGlossary = true; render(); }
  if (action === "close-glossary") { showGlossary = false; render(); }
  if (action === "add-term") {
    const source = app.querySelector<HTMLElement & { value: string }>("#new-term-source");
    const preferred = app.querySelector<HTMLElement & { value: string }>("#new-term-preferred");
    if (source?.value.trim() && preferred?.value.trim()) {
      commit("添加术语", (draft) => { draft.glossary.push({ id: uid("term"), source: source.value.trim(), preferred: preferred.value.trim(), note: "编辑新增术语" }); });
    }
  }
  if (action === "remove-term") {
    const termId = target.dataset.termId;
    commit("删除术语", (draft) => { draft.glossary = draft.glossary.filter((term) => term.id !== termId); });
  }
  if (action === "save-version") {
    const versionId = uid("version");
    commit("保存版本快照", (draft) => {
      draft.versions.unshift({ id: versionId, label: `版本 ${draft.versions.length + 1}`, createdAt: new Date().toISOString(), blocks: structuredClone(draft.blocks), glossary: structuredClone(draft.glossary) });
      draft.versions = draft.versions.slice(0, 10);
    });
    selectedVersionId = versionId;
    render();
  }
  if (action === "approve-all") {
    commit("全部审核通过", (draft) => { draft.blocks.forEach((block) => { block.reviewStatus = "approved"; }); });
  }
  if (action === "export") {
    download(`${project.title}-无障碍版.html`, exportHtml(project));
    document.documentElement.dataset.lastAction = "已导出无障碍 HTML";
    render();
  }
  if (action === "import") app.querySelector<HTMLInputElement>("#chapter-file")?.click();
});

app.addEventListener("sl-change", (event) => {
  const element = event.target as HTMLElement;
  if (element.id === "chapter-file") return;
  if (element.id.startsWith("heading-level-")) {
    const level = Number((element as HTMLElement & { value: string }).value);
    updateActiveBlock((block) => { block.headingLevel = level; block.reviewStatus = "pending"; }, "修改标题层级");
  }
  if (element.id === "version-select") {
    selectedVersionId = (element as HTMLElement & { value: string }).value;
    render();
  }
  if (element.matches("[data-term-id]")) {
    const termId = element.dataset.termId;
    const value = (element as HTMLElement & { value: string }).value;
    commit("修改术语表", (draft) => { const term = draft.glossary.find((item) => item.id === termId); if (term) term.preferred = value; });
  }
});

app.addEventListener("change", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.field === "center-offline") {
    centerOffline = input.checked;
    centerSync = "idle";
    centerMessage = "";
    render();
    return;
  }
  if (input.id !== "chapter-file" || !input.files?.[0]) return;
  void input.files[0].text().then((text) => {
    commit("导入章节文本", (draft) => {
      draft.blocks = parseImportedChapter(text);
      // 重新导入后旧导航表不再适用，按现有内容块顺序补一份待确认初稿
      draft.navTable = createDraftNavTable(draft.blocks);
      activeBlockId = draft.blocks[0]?.id ?? "";
      activeIssueId = "";
    });
  });
});

app.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement;
  if (input.id === "project-title") {
    project.title = input.value;
    saveSoon();
  }
});

window.addEventListener("online", render);
window.addEventListener("offline", render);
window.addEventListener("keydown", (event) => {
  const target = event.target as HTMLElement;
  if (target.matches("input, textarea, sl-input, sl-textarea, [contenteditable='true']")) return;
  if (target.matches('[role="button"]') && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    (target as HTMLElement).click();
    return;
  }
  const command = event.metaKey || event.ctrlKey;
  if (command && event.key.toLowerCase() === "z") {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if (command && event.key.toLowerCase() === "s") {
    event.preventDefault();
    const versionId = uid("version");
    commit("键盘保存版本", (draft) => { draft.versions.unshift({ id: versionId, label: `版本 ${draft.versions.length + 1}`, createdAt: new Date().toISOString(), blocks: structuredClone(draft.blocks), glossary: structuredClone(draft.glossary) }); });
    selectedVersionId = versionId;
    return;
  }
  if (event.key.toLowerCase() === "j" || event.key.toLowerCase() === "k") {
    const list = issues();
    if (!list.length) return;
    const current = Math.max(0, list.findIndex((issue) => issue.id === activeIssueId));
    const next = (current + (event.key.toLowerCase() === "j" ? 1 : -1) + list.length) % list.length;
    activeIssueId = list[next].id;
    activeBlockId = list[next].blockId;
    render();
  }
  if (event.key.toLowerCase() === "e") {
    const button = app.querySelector<HTMLElement>('[data-action="generate"]');
    button?.click();
  }
  if (event.key === "1") { previewMode = "normal"; render(); }
  if (event.key === "2") { previewMode = "assisted"; render(); }
});

render();
void pullFromCenter();
