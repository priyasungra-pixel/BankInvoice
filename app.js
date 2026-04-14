import { numberToWords, formatDate } from './utils.js';

const GSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1as6sDJtbbk-vlFZrnaf2VVBcm4wDCcejDOLPDgQIo34/export?format=csv&gid=0';

document.addEventListener('DOMContentLoaded', () => {
    fetchInvoices();
});

async function fetchInvoices() {
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    Papa.parse(GSHEET_CSV_URL, {
        download: true,
        header: true,
        complete: (results) => {
            loader.style.display = 'none';
            renderInvoiceGrid(results.data);
        },
        error: (err) => {
            console.error('Error fetching CSV:', err);
            loader.innerText = 'Failed to fetch data. Check tab sharing settings.';
        }
    });
}

function renderInvoiceGrid(data) {
    const grid = document.getElementById('invoice-grid');
    grid.innerHTML = '';

    data.forEach((invoice, index) => {
        if (!invoice['Invoice#']) return;

        const card = document.createElement('div');
        card.className = 'invoice-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <span class="status status-${invoice.Status?.toLowerCase()}">${invoice.Status}</span>
                <span style="font-weight: 700; color: var(--primary);">#${invoice['Invoice#']}</span>
            </div>
            <h3 style="margin-bottom: 0.5rem; font-family: 'Outfit';">${invoice['Customer Name']}</h3>
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">${invoice.Address}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; pt: 1rem;">
                <div>
                    <p style="font-size: 0.75rem; color: #999; text-transform: uppercase;">Total Amount</p>
                    <p style="font-weight: 700; font-size: 1.1rem;">₹${parseFloat(invoice.Total || 0).toLocaleString('en-IN')}</p>
                </div>
                <button class="generate-btn" style="background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Download PDF</button>
            </div>
        `;

        card.querySelector('.generate-btn').onclick = (e) => {
            e.stopPropagation();
            generatePDF(invoice);
        };

        grid.appendChild(card);
    });
}

function generatePDF(invoice) {
    const total = parseFloat(invoice.Total || 0);
    const date = formatDate(invoice['Invoice Date']);
    const dueDate = formatDate(invoice['Due Date']);
    const invNo = 'INV-' + invoice['Invoice#'].toString().padStart(6, '0');

    // Parse logic for date-based GST
    const invDate = new Date(invoice['Invoice Date']);
    const thresholdDate = new Date('2025-09-21');

    let gstRate1, gstRate2;
    if (invDate <= thresholdDate) {
        gstRate1 = 0.12; // 12% GST
        gstRate2 = 0.18; // 18% GST (Services)
    } else {
        gstRate1 = 0.05; // 5% GST
        gstRate2 = 0.18; // 18% GST (Services)
    }

    // Populate Template
    document.getElementById('pdf-inv-no').innerText = invNo;
    document.getElementById('pdf-date').innerText = date;
    document.getElementById('pdf-due-date').innerText = dueDate; // Fixed ID from index.html check
    document.getElementById('pdf-bill-to').innerText = invoice['Customer Name'] + '\n' + invoice.Address;
    document.getElementById('pdf-ship-to').innerText = invoice['Customer Name'] + '\n' + invoice.Address;

    // Split logic: 70% of Grand Total to Item 1, 30% to Item 2
    const total1 = total * 0.70;
    const total2 = total * 0.30;

    const base1 = total1 / (1 + gstRate1);
    const tax1 = total1 - base1;

    const base2 = total2 / (1 + gstRate2);
    const tax2 = total2 - base2;

    const itemsHtml = `
        <tr class="item-row">
            <td>1</td>
            <td><strong>Solar Rooftop Power Plant (Kit)</strong></td>
            <td>85414300</td>
            <td>1.00</td>
            <td>${base1.toFixed(2)}</td>
            <td>0.00</td>
            <td>${(gstRate1 / 2 * 100).toFixed(1)}%</td>
            <td>${(tax1 / 2).toFixed(2)}</td>
            <td>${(gstRate1 / 2 * 100).toFixed(1)}%</td>
            <td>${(tax1 / 2).toFixed(2)}</td>
            <td>${total1.toFixed(2)}</td> <!-- Amount in table is usually Base or Total? In the template it looks like Line Total -->
        </tr>
        <tr class="item-row">
            <td>2</td>
            <td><strong>Installation & Commissioning Services</strong></td>
            <td>99540000</td>
            <td>1.00</td>
            <td>${base2.toFixed(2)}</td>
            <td>0.00</td>
            <td>${(gstRate2 / 2 * 100).toFixed(1)}%</td>
            <td>${(tax2 / 2).toFixed(2)}</td>
            <td>${(gstRate2 / 2 * 100).toFixed(1)}%</td>
            <td>${(tax2 / 2).toFixed(2)}</td>
            <td>${total2.toFixed(2)}</td>
        </tr>
    `;
    document.getElementById('pdf-items').innerHTML = itemsHtml;

    const subtotal = (base1 + base2);

    // Formatting for Indian Currency
    const formatCurrency = (num) => {
        return num.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const label1 = (gstRate1 / 2 * 100);
    const label2 = (gstRate2 / 2 * 100);

    const summaryHtml = `
        <table class="summary-table" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 3px 8px; text-align: left;">Sub Total</td>
                <td style="padding: 3px 8px; text-align: right;">${formatCurrency(subtotal)}</td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; text-align: left;">Taxable Amount</td>
                <td style="padding: 3px 8px; text-align: right;">${formatCurrency(subtotal)}</td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; text-align: left;">CGST${label1} (${label1}%)</td>
                <td style="padding: 3px 8px; text-align: right;">${formatCurrency(tax1 / 2)}</td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; text-align: left;">SGST${label1} (${label1}%)</td>
                <td style="padding: 3px 8px; text-align: right;">${formatCurrency(tax1 / 2)}</td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; text-align: left;">CGST${label2} (${label2}%)</td>
                <td style="padding: 3px 8px; text-align: right;">${formatCurrency(tax2 / 2)}</td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; text-align: left;">SGST${label2} (${label2}%)</td>
                <td style="padding: 3px 8px; text-align: right;">${formatCurrency(tax2 / 2)}</td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; text-align: left;">Rounding</td>
                <td style="padding: 3px 8px; text-align: right;">0.00</td>
            </tr>
            <tr class="summary-total" style="font-weight: bold; border-top: 1px solid #000;">
                <td style="padding: 6px 8px; text-align: left;">Total</td>
                <td style="padding: 6px 8px; text-align: right; color: #000; font-weight: bold;">₹${formatCurrency(total)}</td>
            </tr>
        </table>
    `;

    document.getElementById('pdf-summary').innerHTML = summaryHtml;
    document.getElementById('pdf-total-words').innerText = numberToWords(total);

    // Export PDF

    const element = document.getElementById('invoice-template');
    element.style.display = 'block';

    const opt = {
        margin: 0,
        filename: `${invNo}_${invoice['Customer Name']}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
    });
}
