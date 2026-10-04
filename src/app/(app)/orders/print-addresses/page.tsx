"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { Order } from "@/lib/types";
import { fetchOrders } from "@/lib/api";
import "./print-addresses.css";

const KOVAI_NAME = "KOVAI CUSTOMIZES";
const KOVAI_PHONE = "94777 77233";
const KOVAI_INSTAGRAM = "@kovaicustomizes";

type PrintFormat = "full-a4" | "full" | "medium" | "small";

function extractCustomerName(customerDetails: string) {
  const match = customerDetails.match(
    /(?:name|customer\s*name)\s*[:\-]\s*(.+?)(?:\n|,|$)/i
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  const firstLine = customerDetails
    .split("\n")
    .map((x) => x.trim())
    .find(Boolean);

  return firstLine || "CUSTOMER";
}

function extractPhoneNumber(customerDetails: string) {
  const matches = customerDetails.match(/\d{10}/g);
  return matches?.[0] || "";
}

function extractPincode(customerDetails: string) {
  const match = customerDetails.match(/\b\d{6}\b/g);
  return match?.length ? match[match.length - 1] : "";
}

function extractAddress(customerDetails: string) {
  const lines = customerDetails
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const addressLines = lines.filter(
    (line) =>
      !/^(name|customer\s*name|phone|mobile|ph|contact|address)\s*[:\-]/i.test(
        line
      ) &&
      !/^\d{10}$/.test(line) &&
      !/^\d{6}$/.test(line)
  );

  const address = addressLines.join(", ");

  const customerName = extractCustomerName(customerDetails);

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (
    parts.length > 0 &&
    parts[0].toUpperCase() === customerName.toUpperCase()
  ) {
    parts.shift();
  }

  return parts.join(", ");
}

function extractCity(customerDetails: string) {
  const address = extractAddress(customerDetails);
  const pincode = extractPincode(customerDetails);

  if (!address) return "";

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return "";

  const lastPart = parts[parts.length - 1];

  if (pincode && lastPart.includes(pincode)) {
    return lastPart
      .replace(pincode, "")
      .replace(/[-–—]+/g, " ")
      .trim();
  }

  return "";
}

function getOrdersPerPage(format: PrintFormat) {
  if (format === "full-a4") return 1;
  if (format === "full") return 2;
  if (format === "medium") return 4;
  return 6;
}

function PrintAddressesContent() {
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [printFormat, setPrintFormat] =
    useState<PrintFormat>("small");

  const [showLogo, setShowLogo] = useState(true);

  const [showCustomerPhone, setShowCustomerPhone] =
    useState(false);

  const [editingFrom, setEditingFrom] =
    useState(false);

  const [fromAddress, setFromAddress] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const ids = searchParams.get("ids");

        const result = await fetchOrders({
          status: "ALL",
          urgency: "ALL",
          page_size: 100,
        });

        let selectedOrders = result.orders || [];

        if (ids) {
          const selectedIds = ids.split(",");

          selectedOrders = selectedOrders.filter((order) =>
            selectedIds.includes(order.id)
          );
        }

        setOrders(selectedOrders);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [searchParams]);

  if (loading) {
    return <div className="print-loading">LOADING...</div>;
  }

  const ordersPerPage = getOrdersPerPage(printFormat);

  const sheets: Order[][] = [];

  for (
    let i = 0;
    i < orders.length;
    i += ordersPerPage
  ) {
    sheets.push(orders.slice(i, i + ordersPerPage));
  }

  return (
    <div className={`print-address-page format-${printFormat}`}>
      {/* SCREEN CONTROLS */}
      <div className="print-controls">
        <div className="print-controls-title">
          ADDRESS PRINT FORMAT
        </div>

        <div className="format-buttons">
          <button
            type="button"
            className={printFormat === "full-a4" ? "active" : ""}
            onClick={() => setPrintFormat("full-a4")}
          >
            FULL A4
            <span>1 / A4</span>
          </button>

          <button
            type="button"
            className={printFormat === "full" ? "active" : ""}
            onClick={() => setPrintFormat("full")}
          >
            FULL
            <span>2 / A4</span>
          </button>

          <button
            type="button"
            className={printFormat === "medium" ? "active" : ""}
            onClick={() => setPrintFormat("medium")}
          >
            MEDIUM
            <span>4 / A4</span>
          </button>

          <button
            type="button"
            className={printFormat === "small" ? "active" : ""}
            onClick={() => setPrintFormat("small")}
          >
            SMALL
            <span>6 / A4</span>
          </button>
        </div>

        <div className="print-options">
          <button
            type="button"
            onClick={() => setShowLogo((value) => !value)}
          >
            LOGO {showLogo ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCustomerPhone((value) => !value)
            }
          >
            CUSTOMER PHONE{" "}
            {showCustomerPhone ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            onClick={() =>
              setEditingFrom((value) => !value)
            }
          >
            {editingFrom ? "DONE" : "EDIT FROM"}
          </button>

          <button
            type="button"
            className="print-button"
            onClick={() => window.print()}
          >
            PRINT {orders.length}
          </button>
        </div>

        {editingFrom && (
          <input
            type="text"
            value={fromAddress}
            onChange={(event) =>
              setFromAddress(event.target.value)
            }
            placeholder="ENTER BUSINESS ADDRESS"
          />
        )}
      </div>

      {/* PRINT AREA */}
      <main className="print-area">
        {sheets.map((sheet, sheetIndex) => (
          <section className="a4-sheet" key={sheetIndex}>
            {sheet.map((order) => {
              const customerDetails = String(
                order.customer_details || ""
              );

              const customerName =
                extractCustomerName(
                  customerDetails
                ).toUpperCase();

              const customerPhone =
                extractPhoneNumber(customerDetails);

              const customerAddress =
                extractAddress(
                  customerDetails
                ).toUpperCase();

              const pincode =
                extractPincode(customerDetails);

              const city =
                extractCity(
                  customerDetails
                ).toUpperCase();

              return (
                <div
                  className="address-card"
                  key={order.id}
                >
                  {/* =====================================================
                       FULL A4
                       SAME DESIGN AS FULL, ONLY ENLARGED
                  ===================================================== */}

                  {printFormat === "full-a4" && (
                    <>
                      <div className="full-top">
                        {showLogo && (
                          <div className="full-logo">
                            <Image
                              src="/logo.png"
                              alt="Kovai Customizes"
                              width={180}
                              height={100}
                              className="full-logo-image"
                              unoptimized
                            />
                          </div>
                        )}

                        <div className="full-services">
                          <div className="services-title">
                            OUR CUSTOMIZATIONS
                          </div>

                          <div>
                            ACRYLIC GIFTS | CORPORATE GIFTS |
                            BADGES | SHIELDS
                          </div>

                          <div>
                            KEY CHAINS | CAKE TOPPERS | FRAMES |
                            UNIQUE GIFTS
                          </div>

                          <div>
                            ALL CUSTOMIZED GIFT PRODUCTS AVAILABLE.
                          </div>
                        </div>
                      </div>

                      <div className="full-to-section">
                        <div className="section-title">
                          📍 TO:
                        </div>

                        <div className="full-field">
                          <strong>CUSTOMER NAME</strong>
                          <span>:</span>
                          <b>{customerName}</b>
                        </div>

                        <div className="full-field address-field">
                          <strong>ADDRESS</strong>
                          <span>:</span>
                          <b>{customerAddress}</b>
                        </div>

                        {city && (
                          <div className="full-field">
                            <strong>CITY</strong>
                            <span>:</span>
                            <b>{city}</b>
                          </div>
                        )}

                        {pincode && (
                          <div className="full-field">
                            <strong>PINCODE</strong>
                            <span>:</span>
                            <b>{pincode}</b>
                          </div>
                        )}

                        {showCustomerPhone &&
                          customerPhone && (
                            <div className="full-field">
                              <strong>PHONE NO.</strong>
                              <span>:</span>
                              <b>{customerPhone}</b>
                            </div>
                          )}
                      </div>

                      <div className="full-bottom">
                        <div className="full-from">
                          <div className="bottom-title">
                            📦 FROM:
                          </div>

                          <div className="from-name">
                            {KOVAI_NAME}
                          </div>

                          <div className="from-line">
                            ☎ {KOVAI_PHONE}
                          </div>

                          {fromAddress && (
                            <div className="from-line">
                              📍 {fromAddress.toUpperCase()}
                            </div>
                          )}

                          <div className="from-line">
                            ◎ {KOVAI_INSTAGRAM}
                          </div>
                        </div>

                        <div className="full-courier">
                          <div className="courier-line">
                            <strong>COURIER:</strong>
                            <span />
                          </div>

                          <div className="courier-line">
                            <strong>
                              AWB / TRACKING NO.:
                            </strong>
                            <span />
                          </div>

                          <div className="courier-box" />
                        </div>

                        <div className="full-care">
                          <div className="care-icons">
                            <div>
                              <span>⚠</span>
                              <small>FRAGILE</small>
                            </div>

                            <div>
                              <span>☂</span>
                              <small>KEEP DRY</small>
                            </div>

                            <div>
                              <span>↑↑</span>
                              <small>THIS SIDE UP</small>
                            </div>

                            <div className="handle-care">
                              <span>✋</span>
                              <small>HANDLE WITH CARE</small>
                            </div>
                          </div>

                          <div className="thank-you">
                            ♥
                            <strong>
                              MADE WITH CARE • PACKED WITH LOVE
                            </strong>
                            <small>
                              THANK YOU FOR CHOOSING
                              <br />
                              KOVAI CUSTOMIZES
                            </small>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* =====================================================
                       FULL
                       EXISTING 2 / A4 DESIGN — DO NOT CHANGE
                  ===================================================== */}

                  {printFormat === "full" && (
                    <>
                      <div className="full-top">
                        {showLogo && (
                          <div className="full-logo">
                            <Image
                              src="/logo.png"
                              alt="Kovai Customizes"
                              width={150}
                              height={80}
                              className="full-logo-image"
                              unoptimized
                            />
                          </div>
                        )}

                        <div className="full-services">
                          <div className="services-title">
                            OUR CUSTOMIZATIONS
                          </div>

                          <div>
                            ACRYLIC GIFTS | CORPORATE GIFTS |
                            BADGES | SHIELDS
                          </div>

                          <div>
                            KEY CHAINS | CAKE TOPPERS | FRAMES |
                            UNIQUE GIFTS
                          </div>

                          <div>
                            ALL CUSTOMIZED GIFT PRODUCTS AVAILABLE.
                          </div>
                        </div>
                      </div>

                      <div className="full-to-section">
                        <div className="section-title">
                          📍 TO:
                        </div>

                        <div className="full-field">
                          <strong>CUSTOMER NAME</strong>
                          <span>:</span>
                          <b>{customerName}</b>
                        </div>

                        <div className="full-field address-field">
                          <strong>ADDRESS</strong>
                          <span>:</span>
                          <b>{customerAddress}</b>
                        </div>

                        {city && (
                          <div className="full-field">
                            <strong>CITY</strong>
                            <span>:</span>
                            <b>{city}</b>
                          </div>
                        )}

                        {pincode && (
                          <div className="full-field">
                            <strong>PINCODE</strong>
                            <span>:</span>
                            <b>{pincode}</b>
                          </div>
                        )}

                        {showCustomerPhone &&
                          customerPhone && (
                            <div className="full-field">
                              <strong>PHONE NO.</strong>
                              <span>:</span>
                              <b>{customerPhone}</b>
                            </div>
                          )}
                      </div>

                      <div className="full-bottom">
                        <div className="full-from">
                          <div className="bottom-title">
                            📦 FROM:
                          </div>

                          <div className="from-name">
                            {KOVAI_NAME}
                          </div>

                          <div className="from-line">
                            ☎ {KOVAI_PHONE}
                          </div>

                          {fromAddress && (
                            <div className="from-line">
                              📍 {fromAddress.toUpperCase()}
                            </div>
                          )}

                          <div className="from-line">
                            ◎ {KOVAI_INSTAGRAM}
                          </div>
                        </div>

                        <div className="full-courier">
                          <div className="courier-line">
                            <strong>COURIER:</strong>
                            <span />
                          </div>

                          <div className="courier-line">
                            <strong>
                              AWB / TRACKING NO.:
                            </strong>
                            <span />
                          </div>

                          <div className="courier-box" />
                        </div>

                        <div className="full-care">
                          <div className="care-icons">
                            <div>
                              <span>⚠</span>
                              <small>FRAGILE</small>
                            </div>

                            <div>
                              <span>☂</span>
                              <small>KEEP DRY</small>
                            </div>

                            <div>
                              <span>↑↑</span>
                              <small>THIS SIDE UP</small>
                            </div>

                            <div className="handle-care">
                              <span>✋</span>
                              <small>HANDLE WITH CARE</small>
                            </div>
                          </div>

                          <div className="thank-you">
                            ♥
                            <strong>
                              MADE WITH CARE • PACKED WITH LOVE
                            </strong>
                            <small>
                              THANK YOU FOR CHOOSING
                              <br />
                              KOVAI CUSTOMIZES
                            </small>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ================= MEDIUM ================= */}

                  {printFormat === "medium" && (
                    <>
                      <div className="medium-header">
                        {showLogo && (
                          <Image
                            src="/logo.png"
                            alt="Kovai Customizes"
                            width={55}
                            height={55}
                            className="medium-logo"
                            unoptimized
                          />
                        )}

                        <div>
                          <div className="medium-brand">
                            {KOVAI_NAME}
                          </div>

                          <div className="medium-phone">
                            {KOVAI_PHONE}
                          </div>
                        </div>
                      </div>

                      <div className="medium-section-title">
                        TO:
                      </div>

                      <div className="medium-customer">
                        <strong>{customerName}</strong>

                        <div>{customerAddress}</div>

                        {pincode && <div>{pincode}</div>}

                        {showCustomerPhone &&
                          customerPhone && (
                            <div>
                              PH: {customerPhone}
                            </div>
                          )}
                      </div>

                      <div className="medium-from">
                        FROM: {KOVAI_NAME}
                        <br />
                        {KOVAI_PHONE}
                      </div>
                    </>
                  )}

                  {/* ================= SMALL ================= */}

                  {printFormat === "small" && (
                    <>
                      <div className="small-header">
                        {showLogo && (
                          <Image
                            src="/logo.png"
                            alt="Kovai Customizes"
                            width={38}
                            height={38}
                            className="small-logo"
                            unoptimized
                          />
                        )}

                        <div>
                          <div className="small-brand">
                            {KOVAI_NAME}
                          </div>

                          <div className="small-phone">
                            {KOVAI_PHONE}
                          </div>
                        </div>
                      </div>

                      <div className="small-to">
                        TO:
                      </div>

                      <div className="small-customer">
                        <strong>{customerName}</strong>

                        <div>{customerAddress}</div>

                        {pincode && <div>{pincode}</div>}

                        {showCustomerPhone &&
                          customerPhone && (
                            <div>{customerPhone}</div>
                          )}
                      </div>

                      <div className="small-from">
                        FROM: {KOVAI_NAME}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </main>
    </div>
  );
}

export default function PrintAddressesPage() {
  return (
    <Suspense
      fallback={
        <div className="print-loading">
          LOADING...
        </div>
      }
    >
      <PrintAddressesContent />
    </Suspense>
  );
}
