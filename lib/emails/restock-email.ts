/**
 * Rich HTML email template for restock alerts.
 * Includes urgency level, stock gauge, sales velocity & trend analysis.
 */

export interface SalesData {
  totalUnitsSold: number;
  dailyAverage: number;
  weeklyAverage: number;
  peakDay: string;
  peakDayUnits: number;
  previousWeekUnits: number;
  currentWeekUnits: number;
  daysTracked: number;
  estimatedDaysUntilStockout: number | null;
}

export interface RestockEmailProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  image?: string;
}

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export function getUrgencyLevel(stock: number): UrgencyLevel {
  if (stock <= 1) return 'CRITICAL';
  if (stock <= 5) return 'HIGH';
  return 'MEDIUM';
}

export function getTrendLabel(
  currentWeekUnits: number,
  previousWeekUnits: number
): { label: string; icon: string; pct: number } {
  if (previousWeekUnits === 0) {
    return { label: 'New Product — No Prior Data', icon: '🆕', pct: 0 };
  }
  const pct = Math.round(((currentWeekUnits - previousWeekUnits) / previousWeekUnits) * 100);
  if (pct >= 20) return { label: 'ACCELERATING', icon: '📈', pct };
  if (pct <= -20) return { label: 'SLOWING', icon: '📉', pct };
  return { label: 'STEADY', icon: '➡️', pct };
}

export function generateRestockEmailHTML(
  product: RestockEmailProduct,
  salesData: SalesData,
  triggeredBy: 'auto' | 'manual' = 'manual',
  adminName?: string,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nadinekollections.com'
): string {
  const urgency = getUrgencyLevel(product.stock);
  const trend = getTrendLabel(salesData.currentWeekUnits, salesData.previousWeekUnits);

  const urgencyConfig: Record<UrgencyLevel, { color: string; bg: string; border: string; label: string; emoji: string }> = {
    CRITICAL: {
      color: '#ffffff',
      bg: '#DC2626',
      border: '#B91C1C',
      label: 'CRITICAL — Immediate Action Required',
      emoji: '🚨',
    },
    HIGH: {
      color: '#ffffff',
      bg: '#D97706',
      border: '#B45309',
      label: 'HIGH — Restock Soon',
      emoji: '⚠️',
    },
    MEDIUM: {
      color: '#ffffff',
      bg: '#2563EB',
      border: '#1D4ED8',
      label: 'MEDIUM — Monitor Closely',
      emoji: '📦',
    },
  };

  const uc = urgencyConfig[urgency];

  // Gauge: assume max stock of 50 for display purposes
  const maxStock = Math.max(50, product.stock * 10);
  const gaugePercent = Math.round((product.stock / maxStock) * 100);
  const gaugeColor = urgency === 'CRITICAL' ? '#DC2626' : urgency === 'HIGH' ? '#D97706' : '#22C55E';

  const stockoutText =
    salesData.estimatedDaysUntilStockout === null
      ? 'Unknown (no recent sales)'
    : salesData.estimatedDaysUntilStockout === 0
      ? '⚡ TODAY or TOMORROW'
    : salesData.estimatedDaysUntilStockout <= 3
      ? `⚡ ~${salesData.estimatedDaysUntilStockout} day(s)`
      : `~${salesData.estimatedDaysUntilStockout} day(s)`;

  const triggerNote =
    triggeredBy === 'auto'
      ? `<p style="color:#9CA3AF;font-size:12px;margin:0;">This alert was triggered automatically because stock dropped below 2 units.</p>`
      : adminName
      ? `<p style="color:#9CA3AF;font-size:12px;margin:0;">Manually requested by <strong>${adminName}</strong> via the admin dashboard.</p>`
      : `<p style="color:#9CA3AF;font-size:12px;margin:0;">Manually requested via the admin dashboard.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restock Alert — ${product.title}</title>
</head>
<body style="margin:0;padding:0;background:#0F0F0F;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0F0F0F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#D4AF37;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Nadine Kollections</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Inventory Restock Alert</h1>
              <p style="margin:8px 0 0;color:#94A3B8;font-size:14px;">Product Stock Intelligence Report</p>
            </td>
          </tr>

          <!-- Urgency Banner -->
          <tr>
            <td style="background:${uc.bg};border-left:4px solid ${uc.border};padding:16px 40px;">
              <p style="margin:0;color:${uc.color};font-size:15px;font-weight:700;letter-spacing:0.5px;">
                ${uc.emoji}&nbsp;&nbsp;${uc.label}
              </p>
            </td>
          </tr>

          <!-- Product Info -->
          <tr>
            <td style="background:#1C1C1C;padding:32px 40px;">

              <!-- Product Title Block -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h2 style="margin:0 0 4px;color:#ffffff;font-size:22px;font-weight:700;">${product.title}</h2>
                    <p style="margin:0 0 24px;color:#94A3B8;font-size:14px;text-transform:uppercase;letter-spacing:1px;">${product.category}</p>
                  </td>
                  <td align="right" valign="top">
                    <span style="background:#D4AF37;color:#000;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;">
                      ₦${product.price.toLocaleString()}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Stock Gauge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td>
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                      <span style="color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Current Stock Level</span>
                      <span style="color:${gaugeColor};font-size:20px;font-weight:800;">${product.stock} unit${product.stock !== 1 ? 's' : ''} left</span>
                    </div>
                    <div style="background:#2D2D2D;border-radius:999px;height:10px;overflow:hidden;">
                      <div style="background:${gaugeColor};height:10px;width:${gaugePercent}%;border-radius:999px;"></div>
                    </div>
                    <p style="margin:6px 0 0;color:#6B7280;font-size:11px;">Stock at ${gaugePercent}% of reference capacity</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #2D2D2D;margin:0 0 28px;" />

              <!-- Sales Velocity -->
              <h3 style="margin:0 0 16px;color:#D4AF37;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">📊 Sales Velocity</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px;background:#252525;border-radius:10px;margin:0 4px;">
                    <p style="margin:0 0 4px;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Daily Avg</p>
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">${salesData.dailyAverage.toFixed(1)}</p>
                    <p style="margin:0;color:#6B7280;font-size:11px;">units/day</p>
                  </td>
                  <td width="4px"></td>
                  <td width="33%" style="text-align:center;padding:16px;background:#252525;border-radius:10px;">
                    <p style="margin:0 0 4px;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">This Week</p>
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">${salesData.currentWeekUnits}</p>
                    <p style="margin:0;color:#6B7280;font-size:11px;">units sold</p>
                  </td>
                  <td width="4px"></td>
                  <td width="33%" style="text-align:center;padding:16px;background:#252525;border-radius:10px;">
                    <p style="margin:0 0 4px;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total Sold</p>
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">${salesData.totalUnitsSold}</p>
                    <p style="margin:0;color:#6B7280;font-size:11px;">all time</p>
                  </td>
                </tr>
              </table>

              ${salesData.peakDay ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#1A2744;border-left:3px solid #2563EB;border-radius:0 8px 8px 0;padding:12px 16px;">
                    <p style="margin:0;color:#93C5FD;font-size:13px;">
                      🏆 <strong>Peak Day:</strong> ${salesData.peakDay} — ${salesData.peakDayUnits} units sold
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #2D2D2D;margin:0 0 28px;" />

              <!-- Trend Analysis -->
              <h3 style="margin:0 0 16px;color:#D4AF37;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">📈 Trend Analysis</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#252525;border-radius:10px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;color:#94A3B8;font-size:12px;">Sales Trend (vs last week)</p>
                          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${trend.icon} ${trend.label}</p>
                        </td>
                        <td align="right">
                          ${trend.pct !== 0 ? `
                          <span style="background:${trend.pct > 0 ? '#14532D' : '#450A0A'};color:${trend.pct > 0 ? '#4ADE80' : '#F87171'};padding:6px 12px;border-radius:999px;font-size:14px;font-weight:700;">
                            ${trend.pct > 0 ? '+' : ''}${trend.pct}%
                          </span>
                          ` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:12px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" style="padding-right:8px;">
                                <p style="margin:0 0 4px;color:#6B7280;font-size:11px;">Last Week</p>
                                <p style="margin:0;color:#94A3B8;font-size:16px;font-weight:600;">${salesData.previousWeekUnits} units</p>
                              </td>
                              <td width="50%" style="padding-left:8px;">
                                <p style="margin:0 0 4px;color:#6B7280;font-size:11px;">This Week</p>
                                <p style="margin:0;color:#ffffff;font-size:16px;font-weight:600;">${salesData.currentWeekUnits} units</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Stockout Estimate -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:${urgency === 'CRITICAL' ? '#450A0A' : urgency === 'HIGH' ? '#451A03' : '#1E3A5F'};border:1px solid ${urgency === 'CRITICAL' ? '#B91C1C' : urgency === 'HIGH' ? '#B45309' : '#1D4ED8'};border-radius:10px;padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">⏳ Estimated Stockout</p>
                    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${stockoutText}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/admin/products/${product.id}/edit"
                       style="display:inline-block;background:linear-gradient(135deg,#D4AF37,#F0C040);color:#000000;font-size:16px;font-weight:700;padding:16px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.5px;">
                      Update Stock Now →
                    </a>
                    <p style="margin:12px 0 0;color:#6B7280;font-size:12px;">or visit <a href="${siteUrl}/admin/products" style="color:#D4AF37;">Admin Dashboard</a></p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111111;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #2D2D2D;">
              <p style="margin:0 0 8px;color:#4B5563;font-size:12px;">
                ${triggerNote.replace(/<\/?p[^>]*>/g, '')}
              </p>
              <p style="margin:0;color:#374151;font-size:11px;">
                © ${new Date().getFullYear()} Nadine Kollections &nbsp;|&nbsp;
                <a href="${siteUrl}/admin" style="color:#D4AF37;text-decoration:none;">Admin Panel</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
