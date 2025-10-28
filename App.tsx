import React, { useState, useMemo, FC, FormEvent, useRef, useEffect } from 'react';
import type { Sale } from './types';

// --- Helper Components & Icons (defined outside App to prevent re-creation on re-renders) ---

const NairaSignIcon: FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 12H5m14 0H5m14 4H5m14-8H5M7 4v16" />
    </svg>
);


const ShoppingBagIcon: FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const PlusIcon: FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const PrintIcon: FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
);

const TrashIcon: FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);


interface SummaryCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}
const SummaryCard: FC<SummaryCardProps> = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 transition-all hover:shadow-lg hover:scale-105">
        <div className="bg-blue-100 text-blue-600 rounded-full p-3">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-semibold text-slate-800">{value}</p>
        </div>
    </div>
);

interface FormItem {
    id: number;
    productName: string;
    sellPrice: string;
    quantity: string;
}

const App: FC = () => {
    const [sales, setSales] = useState<Sale[]>(() => {
        try {
            const savedSales = localStorage.getItem('asg-business-venture-sales');
            return savedSales ? JSON.parse(savedSales) : [];
        } catch (error) {
            console.error("Failed to parse sales from localStorage", error);
            return [];
        }
    });

    const [items, setItems] = useState<FormItem[]>([{ id: Date.now(), productName: '', sellPrice: '', quantity: '' }]);
    const [error, setError] = useState<string | null>(null);
    const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            localStorage.setItem('asg-business-venture-sales', JSON.stringify(sales));
        } catch (error) {
            console.error("Failed to save sales to localStorage", error);
        }
    }, [sales]);

    const summary = useMemo(() => {
        const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
        const totalSales = sales.length;
        return { totalRevenue, totalSales };
    }, [sales]);
    
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const allSelected = sales.length > 0 && selectedSaleIds.size === sales.length;
            const someSelected = selectedSaleIds.size > 0 && !allSelected;
            selectAllCheckboxRef.current.checked = allSelected;
            selectAllCheckboxRef.current.indeterminate = someSelected;
        }
    }, [selectedSaleIds, sales]);

    const formatCurrency = (amount: number) => {
        return `₦${amount.toFixed(2)}`;
    };
    
    const handleItemChange = (id: number, field: keyof Omit<FormItem, 'id'>, value: string) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleAddItem = () => {
        setItems(prevItems => [...prevItems, { id: Date.now(), productName: '', sellPrice: '', quantity: '' }]);
    };

    const handleRemoveItem = (id: number) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const newSales: Sale[] = [];
        let hasError = false;

        for (const item of items) {
            // Skip empty rows
            if (!item.productName && !item.sellPrice && !item.quantity) {
                continue;
            }

            const numQuantity = parseFloat(item.quantity);
            const numSellPrice = parseFloat(item.sellPrice);

            if (!item.productName.trim()) {
                setError('Product name cannot be empty for an item.');
                hasError = true;
                break;
            }
            if (isNaN(numQuantity) || numQuantity <= 0) {
                setError(`Please enter a valid quantity for "${item.productName}".`);
                hasError = true;
                break;
            }
            if (isNaN(numSellPrice) || numSellPrice <= 0) {
                setError(`Please enter a valid sell price for "${item.productName}".`);
                hasError = true;
                break;
            }

            newSales.push({
                id: new Date().toISOString() + Math.random(),
                productName: item.productName.trim(),
                quantity: numQuantity,
                sellPrice: numSellPrice,
                totalAmount: numQuantity * numSellPrice,
                date: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
            });
        }
        
        if (hasError) return;

        if (newSales.length === 0) {
            setError("Please add at least one item to record a sale.");
            return;
        }

        setSales(prevSales => [...newSales, ...prevSales]);
        setItems([{ id: Date.now(), productName: '', sellPrice: '', quantity: '' }]);
    };

    const handleToggleSelect = (saleId: string) => {
        setSelectedSaleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(saleId)) {
                newSet.delete(saleId);
            } else {
                newSet.add(saleId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedSaleIds(new Set(sales.map(s => s.id)));
        } else {
            setSelectedSaleIds(new Set());
        }
    };

    const handlePrintReceipt = () => {
        if (selectedSaleIds.size === 0) return;

        const selectedSales = sales.filter(sale => selectedSaleIds.has(sale.id)).reverse();
        const totalAmount = selectedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        const receiptContent = `
            <html>
                <head>
                    <title>Customer Receipt</title>
                    <style>
                        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; margin: 2rem; color: #333; }
                        .container { max-width: 800px; margin: auto; }
                        h1, h2 { text-align: center; color: #1e293b; }
                        h1 { margin-bottom: 0; }
                        h2 { margin-top: 0.5rem; font-weight: 500; }
                        table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
                        th, td { border-bottom: 1px solid #cbd5e1; padding: 12px 8px; text-align: left; }
                        th { background-color: #f1f5f9; color: #475569; font-weight: 600; }
                        .text-right { text-align: right; }
                        tfoot td { border-bottom: none; }
                        .total { font-weight: bold; font-size: 1.1em; }
                        .header { margin-bottom: 2rem; text-align: center; }
                        .date { text-align: right; color: #64748b; font-size: 0.9em; margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>ASG Business Venture</h1>
                            <h2>Customer Receipt</h2>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th class="text-right">Quantity</th>
                                    <th class="text-right">Unit Price</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${selectedSales.map(sale => `
                                    <tr>
                                        <td>${sale.productName}</td>
                                        <td class="text-right">${sale.quantity}</td>
                                        <td class="text-right">${formatCurrency(sale.sellPrice)}</td>
                                        <td class="text-right">${formatCurrency(sale.totalAmount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" class="total text-right">Grand Total:</td>
                                    <td class="total text-right">${formatCurrency(totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <p class="date">Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(receiptContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } else {
            alert('Please allow popups for this website to print receipts.');
        }
        setSelectedSaleIds(new Set());
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">ASG Business Venture</h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-1">Your daily sales tracker</p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <SummaryCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon={<NairaSignIcon />} />
                    <SummaryCard title="Total Sales" value={summary.totalSales.toString()} icon={<ShoppingBagIcon />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-slate-700">Record a New Sale</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-x-2 gap-y-3 p-3 border border-slate-200 rounded-lg relative">
                                        <div className="col-span-12">
                                            <label htmlFor={`productName-${item.id}`} className="block text-xs font-medium text-slate-500">Product Name</label>
                                            <input
                                                type="text"
                                                id={`productName-${item.id}`}
                                                value={item.productName}
                                                onChange={(e) => handleItemChange(item.id, 'productName', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="e.g. T-Shirt"
                                            />
                                        </div>
                                        <div className="col-span-6">
                                            <label htmlFor={`sellPrice-${item.id}`} className="block text-xs font-medium text-slate-500">Sell Price</label>
                                            <div className="relative mt-1 rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">₦</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    id={`sellPrice-${item.id}`}
                                                    value={item.sellPrice}
                                                    onChange={(e) => handleItemChange(item.id, 'sellPrice', e.target.value)}
                                                    className="block w-full rounded-md border-slate-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                    placeholder="0.00"
                                                    min="0.01"
                                                    step="0.01"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-6">
                                            <label htmlFor={`quantity-${item.id}`} className="block text-xs font-medium text-slate-500">Quantity</label>
                                            <input
                                                type="number"
                                                id={`quantity-${item.id}`}
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="e.g. 5"
                                                min="1"
                                                step="1"
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <div className="absolute top-1 right-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-full p-1 transition-colors"
                                                    aria-label="Remove item"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 text-sm font-medium rounded-md text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Another Item
                            </button>
                            
                            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                            
                            <div className="mt-6 border-t border-slate-200 pt-4">
                                <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                    Record Sale
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-700">Recent Sales</h2>
                            {sales.length > 0 && (
                                <button
                                    onClick={handlePrintReceipt}
                                    disabled={selectedSaleIds.size === 0}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Print selected sales"
                                >
                                    <PrintIcon className="mr-2 -ml-1" />
                                    Print Receipt
                                </button>
                            )}
                        </div>
                        <div className="overflow-auto max-h-[60vh]">
                            {sales.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <p>No sales recorded yet.</p>
                                    <p className="text-sm">Use the form to add your first sale.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center py-2 px-2 border-b border-slate-200 bg-slate-50 sticky top-0">
                                        <input
                                            ref={selectAllCheckboxRef}
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            onChange={handleSelectAll}
                                            aria-label="Select all sales"
                                        />
                                        <label htmlFor="selectAll" className="ml-3 text-sm font-medium text-slate-600 select-none">
                                            {selectedSaleIds.size > 0 ? `${selectedSaleIds.size} selected` : 'Select All'}
                                        </label>
                                    </div>
                                    <ul className="divide-y divide-slate-200">
                                        {sales.map((sale) => (
                                            <li key={sale.id} className="p-2 flex items-center hover:bg-slate-50 rounded-md cursor-pointer" onClick={() => handleToggleSelect(sale.id)}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none"
                                                    checked={selectedSaleIds.has(sale.id)}
                                                    readOnly
                                                    aria-labelledby={`sale-product-${sale.id}`}
                                                />
                                                <div className="ml-3 flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                    <div className="flex-1 mb-2 sm:mb-0">
                                                        <p id={`sale-product-${sale.id}`} className="font-medium text-slate-800">{sale.productName}</p>
                                                        <p className="text-sm text-slate-500">{sale.quantity} x {formatCurrency(sale.sellPrice)}</p>
                                                    </div>
                                                    <div className="text-left sm:text-right">
                                                        <p className="font-semibold text-lg text-blue-600">{formatCurrency(sale.totalAmount)}</p>
                                                        <p className="text-xs text-slate-400">{sale.date}</p>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;