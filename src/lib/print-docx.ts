/** Render a DOCX blob in a hidden frame and open the browser print dialog (print or "Save as PDF"). */
export async function printDocx(blob: Blob) {
  const { renderAsync } = await import("docx-preview");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write("<!doctype html><html><head><style>@page{margin:0}body{margin:0}.docx-wrapper{background:none!important;padding:0!important}.docx-wrapper>section.docx{box-shadow:none!important;margin:0!important}</style></head><body></body></html>");
  doc.close();
  await renderAsync(blob, doc.body, doc.head, { inWrapper: true, ignoreLastRenderedPageBreak: false });
  await new Promise(r => setTimeout(r, 300));
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 60_000);
}
