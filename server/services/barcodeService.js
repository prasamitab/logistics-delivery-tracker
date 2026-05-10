const JsBarcode = require("jsbarcode");
const { DOMImplementation, XMLSerializer } = require("xmldom");

exports.generateBarcodeSvg = (value) => {
  const xmlSerializer = new XMLSerializer();
  const document = new DOMImplementation().createDocument(
    "http://www.w3.org/1999/xhtml",
    "html",
    null
  );

  const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  JsBarcode(svgNode, value, {
    format: "CODE128",
    displayValue: true,
    fontSize: 14,
    margin: 10,
    xmlDocument: document,
  });

  const svgText = xmlSerializer.serializeToString(svgNode);
  return svgText;
};
