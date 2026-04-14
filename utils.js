export function numberToWords(num) {
    if (num === 0) return 'Zero';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    function convertGroup(n) {
        let res = '';
        if (n >= 100) {
            res += units[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 10 && n <= 19) {
            res += teens[n - 10] + ' ';
        } else if (n >= 20 || n > 0) {
            res += tens[Math.floor(n / 10)] + ' ' + units[n % 10] + ' ';
        }
        return res;
    }

    let words = '';
    let numStr = Math.floor(num).toString();
    
    // Indian Numbering System: 3, 2, 2...
    let chunks = [];
    chunks.push(parseInt(numStr.slice(-3)));
    numStr = numStr.slice(0, -3);
    
    while (numStr.length > 0) {
        chunks.push(parseInt(numStr.slice(-2)));
        numStr = numStr.slice(0, -2);
    }

    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i] > 0) {
            words = convertGroup(chunks[i]) + (scales[i] ? scales[i] + ' ' : '') + words;
        }
    }

    const paise = Math.round((num % 1) * 100);
    let paiseStr = '';
    if (paise > 0) {
        paiseStr = 'and ' + convertGroup(paise) + 'Paise ';
    }

    return 'Rupees ' + words.trim() + ' ' + paiseStr + 'Only';
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return d.getDate() + '-' + months[d.getMonth()] + '-' + d.getFullYear();
    } catch (e) {
        return dateStr;
    }
}
