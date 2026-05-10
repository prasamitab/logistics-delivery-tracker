import { ReactBarcode } from "react-jsbarcode";

export default function BarcodeLabel({ value }) {
  if (!value || !String(value).trim()) {
    return (
      <div className="message error">
        Tracking ID not available for barcode
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "12px",
        borderRadius: "12px",
        display: "inline-block",
      }}
    >
      <ReactBarcode
        value={String(value)}
        options={{
          format: "CODE128",
          width: 2,
          height: 70,
          displayValue: true,
          fontSize: 16,
          margin: 10,
          background: "#ffffff",
          lineColor: "#111111",
        }}
        renderer="svg"
      />
    </div>
  );
}