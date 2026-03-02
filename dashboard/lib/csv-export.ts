/**
 * CSV Export Utility
 * Download any data array as a CSV file
 */
export function exportToCSV(data: any[], filename: string, columns?: { key: string; label: string }[]) {
    if (!data || data.length === 0) return

    // Auto-detect columns if not provided
    const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1') }))

    // Header row
    const header = cols.map(c => `"${c.label}"`).join(',')

    // Data rows
    const rows = data.map(item =>
        cols.map(c => {
            let val = item[c.key]
            if (val === null || val === undefined) val = ''
            if (typeof val === 'object') val = JSON.stringify(val)
            // Escape quotes
            val = String(val).replace(/"/g, '""')
            return `"${val}"`
        }).join(',')
    )

    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Export orders data with specific columns
 */
export function exportOrdersCSV(orders: any[]) {
    exportToCSV(orders, 'nextplate_orders', [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'orderStatus', label: 'Status' },
        { key: 'totalAmount', label: 'Amount ($)' },
        { key: 'totalItems', label: 'Items' },
        { key: 'createdAt', label: 'Date' },
        { key: 'paymentMethod', label: 'Payment' },
    ])
}
