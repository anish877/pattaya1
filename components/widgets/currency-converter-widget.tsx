// "use client";

// import type React from "react";

// import { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { TrendingUp, BarChart3, Heart, Zap, Loader2, AlertCircle, ArrowRightLeft, DollarSign, Coins, Calculator, Sparkles, Star, RefreshCw, TrendingDown } from "lucide-react";
// import { useCurrencyConverter, useCurrencyConversion, useCurrencyHistory } from '@/hooks/use-currency-converter';
// import { WidgetWrapper } from './WidgetWrapper';
// import { SponsorshipBanner } from './sponsorship-banner';

// const LazyChart = lazy(() => import("./lazy-chart").then((module) => ({ default: module.LazyChart })));
// const LazyConverter = lazy(() => import("./lazy-converter").then((module) => ({ default: module.LazyConverter })));

// // Default trending currencies (will be replaced with real data from API)
// const DEFAULT_TRENDING_CURRENCIES = [
//   { code: "USD", name: "US Dollar", flag: "🇺🇸", trend: "+1.8%", rank: 2 },
//   { code: "THB", name: "Thai Baht", flag: "🇹🇭", trend: "+2.3%", rank: 1 },
//   { code: "EUR", name: "Euro", flag: "🇪🇺", trend: "+0.9%", rank: 3 },
//   { code: "GBP", name: "British Pound", flag: "🇬🇧", trend: "+1.2%", rank: 4 },
//   { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", trend: "-0.5%", rank: 5 },
//   { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", trend: "+0.7%", rank: 6 },
//   { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", trend: "+1.1%", rank: 7 },
//   { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", trend: "-0.3%", rank: 8 },
//   { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", trend: "+0.4%", rank: 9 },
//   { code: "KRW", name: "South Korean Won", flag: "🇰🇷", trend: "+0.8%", rank: 10 },
// ];

// // Default popular pairs (will be replaced with real rates from API)
// const DEFAULT_POPULAR_PAIRS = [
//   { from: "USD", to: "THB", rate: "31.76" },
//   { from: "EUR", to: "THB", rate: "37.18" },
//   { from: "GBP", to: "THB", rate: "42.98" },
//   { from: "JPY", to: "THB", rate: "0.216" },
//   { from: "CNY", to: "THB", rate: "4.46" },
//   { from: "SGD", to: "THB", rate: "24.81" },
// ];

// interface CurrencyConverterWidgetProps {
//   onCurrencySelect?: (from: string, to: string) => void;
//   showCharts?: boolean;
//   compact?: boolean;
//   theme?: 'primary' | 'nightlife';
//   className?: string;
// }

// export function CurrencyConverterWidget({ onCurrencySelect, showCharts = true, compact = true, theme = 'primary', className }: CurrencyConverterWidgetProps) {
//   const { currencies, rates, settings, loading: initialLoading, error: initialError, refreshRates } = useCurrencyConverter();
//   const { result, loading: converting, error: convertError, convert, clearResult } = useCurrencyConversion();
//   const { history, loading: historyLoading, error: historyError, fetchHistory, clearHistory } = useCurrencyHistory();
  
//   const [selectedFromCurrency, setSelectedFromCurrency] = useState("USD");
//   const [selectedToCurrency, setSelectedToCurrency] = useState("THB");
//   const [amount, setAmount] = useState(1000);
//   const [isLoading, setIsLoading] = useState(false);
//   const [exchangeRate, setExchangeRate] = useState<number | null>(null);
//   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
//   const [showExpandedModal, setShowExpandedModal] = useState(false);

//   const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
//   const [isResizing, setIsResizing] = useState(false);
//   const [resizeDirection, setResizeDirection] = useState<"horizontal" | "vertical" | "both" | null>(null);
//   const widgetRef = useRef<HTMLDivElement>(null);
//   const startPos = useRef({ x: 0, y: 0 });
//   const startDimensions = useRef({ width: 0, height: 0 });

//   const isPrimary = theme === 'primary';

//   // Generate trending currencies from real API data
//   const getTrendingCurrencies = () => {
//     if (currencies.length === 0) return DEFAULT_TRENDING_CURRENCIES;
    
//     // Get top currencies with mock trend data (in production, this would come from real analytics)
//     const topCurrencies = currencies.slice(0, 10).map((currency, index) => ({
//       code: currency.code,
//       name: currency.name,
//       flag: currency.flag,
//       trend: index % 3 === 0 ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%` : 
//              index % 3 === 1 ? `-${(Math.random() * 1 + 0.2).toFixed(1)}%` : 
//              `+${(Math.random() * 1.5 + 0.3).toFixed(1)}%`,
//       rank: index + 1
//     }));
    
//     return topCurrencies;
//   };

//   const trendingCurrencies = getTrendingCurrencies();

//   // Generate popular pairs from real exchange rates
//   const getPopularPairs = () => {
//     if (!rates?.rates) return DEFAULT_POPULAR_PAIRS;
    
//     const popularPairs = [
//       { from: "USD", to: "THB" },
//       { from: "EUR", to: "THB" },
//       { from: "GBP", to: "THB" },
//       { from: "JPY", to: "THB" },
//       { from: "CNY", to: "THB" },
//       { from: "SGD", to: "THB" },
//     ];
    
//     return popularPairs.map(pair => {
//       // For pairs like USD to THB, the rate is directly from rates.rates[USD]
//       const rate = rates.rates[pair.from] || 1;
//       return {
//         ...pair,
//         rate: rate.toFixed(4)
//       };
//     });
//   };

//   const popularPairs = getPopularPairs();

//   // Load historical data for charts
//   const loadHistoricalData = useCallback(async () => {
//     if (selectedFromCurrency && selectedToCurrency && selectedFromCurrency !== selectedToCurrency) {
//       try {
//         await fetchHistory(selectedToCurrency, 7);
//       } catch (error) {
//         console.error('Failed to load historical data:', error);
//       }
//     }
//   }, [selectedFromCurrency, selectedToCurrency, fetchHistory]);

//   // Initialize with settings
//   useEffect(() => {
//     if (settings) {
//       setSelectedFromCurrency(settings.defaultFromCurrency);
//       setSelectedToCurrency(settings.defaultToCurrency);
//     }
//   }, [settings]);

//   // Update last updated timestamp when rates change
//   useEffect(() => {
//     if (rates?.timestamp) {
//       setLastUpdated(new Date(rates.timestamp));
//     }
//   }, [rates]);

//   // Load exchange rate using real API
//   useEffect(() => {
//     const loadExchangeRate = async () => {
//       if (selectedFromCurrency === selectedToCurrency) {
//         setExchangeRate(1);
//         return;
//       }

//       setIsLoading(true);
//       try {
//         // Use the real API to convert currency
//         const result = await convert(selectedFromCurrency, selectedToCurrency, 1);
//         if (result) {
//           setExchangeRate(result.rate);
//         } else if (rates && rates.rates) {
//           // Backend uses THB as base currency, rates are "THB per unit of other currency"
//           let calculatedRate;
          
//           if (selectedFromCurrency === 'THB') {
//             // Converting from THB to another currency: divide by rate
//             calculatedRate = 1 / (rates.rates[selectedToCurrency] || 1);
//           } else if (selectedToCurrency === 'THB') {
//             // Converting from another currency to THB: multiply by rate
//             calculatedRate = rates.rates[selectedFromCurrency] || 1;
//           } else {
//             // Converting between two non-THB currencies: convert via THB
//             const fromRate = rates.rates[selectedFromCurrency] || 1;
//             const toRate = rates.rates[selectedToCurrency] || 1;
//             calculatedRate = fromRate / toRate;
//           }
          
//           setExchangeRate(calculatedRate);
//         }
//       } catch (error) {
//         console.error("Failed to load exchange rate:", error);
//         // Fallback to mock data only if API completely fails
//         setExchangeRate(selectedFromCurrency === 'THB' ? 0.03176 : 31.76);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (selectedFromCurrency && selectedToCurrency) {
//       loadExchangeRate();
//     }
//   }, [selectedFromCurrency, selectedToCurrency, rates, convert]);

//   // Load historical data when currencies change
//   useEffect(() => {
//     loadHistoricalData();
//   }, [loadHistoricalData]);

//   const handleTrendingCurrencyClick = (currencyCode: string) => {
//     if (selectedFromCurrency === currencyCode) {
//       setSelectedToCurrency(currencyCode);
//       setSelectedFromCurrency(selectedToCurrency);
//     } else {
//       setSelectedToCurrency(currencyCode);
//     }
//     onCurrencySelect?.(selectedFromCurrency, currencyCode);
//   };

//   const handleQuickAmount = (newAmount: number) => {
//     setAmount(newAmount);
//   };

//   const swapCurrencies = () => {
//     setSelectedFromCurrency(selectedToCurrency);
//     setSelectedToCurrency(selectedFromCurrency);
//   };

//   const handleMouseDown = (e: React.MouseEvent, direction: "horizontal" | "vertical" | "both") => {
//     e.preventDefault();
//     setIsResizing(true);
//     setResizeDirection(direction);
//     startPos.current = { x: e.clientX, y: e.clientY };
//     startDimensions.current = { ...dimensions };

//     document.addEventListener("mousemove", handleMouseMove);
//     document.addEventListener("mouseup", handleMouseUp);
//   };

//   const handleMouseMove = (e: MouseEvent) => {
//     if (!isResizing || !resizeDirection) return;

//     const deltaX = e.clientX - startPos.current.x;
//     const deltaY = e.clientY - startPos.current.y;

//     const newDimensions = { ...startDimensions.current };

//     if (resizeDirection === "horizontal" || resizeDirection === "both") {
//       newDimensions.width = Math.max(280, Math.min(600, startDimensions.current.width + deltaX));
//     }

//     if (resizeDirection === "vertical" || resizeDirection === "both") {
//       newDimensions.height = Math.max(350, Math.min(800, startDimensions.current.height + deltaY));
//     }

//     setDimensions(newDimensions);
//   };

//   const handleMouseUp = () => {
//     setIsResizing(false);
//     setResizeDirection(null);
//     document.removeEventListener("mousemove", handleMouseMove);
//     document.removeEventListener("mouseup", handleMouseUp);
//   };

//   if (initialError) {
//     return (
//       <div className="h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl">
//         <div className="text-center text-gray-600">
//           <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3 animate-pulse" />
//           <p className="text-sm font-medium mb-2">Failed to load currency converter</p>
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={refreshRates}
//             className="bg-white hover:bg-emerald-50 border-emerald-200"
//                 >
//             <RefreshCw className="w-4 h-4 mr-2" />
//                   Retry
//                 </Button>
//               </div>
//             </div>
//     );
//   }

//   return (
//     <>
//       {/* Main Widget - Clickable to expand */}
//       <div 
//         className="h-full flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-xl overflow-hidden relative shadow-sm border border-emerald-200 cursor-pointer hover:shadow-md transition-shadow duration-300"
//         onClick={() => setShowExpandedModal(true)}
//       >
//         {/* Clean Header with Animated Icons */}
//         <div className="relative p-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-100 to-green-100 overflow-hidden">
//           {/* Animated Background Icons */}
//           <DollarSign className="absolute top-2 left-2 w-4 h-4 text-emerald-300 opacity-60 animate-pulse" />
//           <Coins className="absolute top-3 right-4 w-5 h-5 text-green-400 opacity-50 animate-bounce" style={{ animationDelay: '0.5s' }} />
//           <TrendingUp className="absolute bottom-1 left-6 w-3 h-3 text-teal-400 opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
//           <Star className="absolute bottom-2 right-2 w-4 h-4 text-emerald-300 opacity-30 animate-ping" style={{ animationDelay: '1.5s' }} />
//           <Sparkles className="absolute top-1 right-8 w-3 h-3 text-green-300 opacity-50 animate-spin" style={{ animationDelay: '2s', animationDuration: '3s' }} />
          
//           <div className="flex items-center justify-between relative z-10">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg shadow-sm">
//                 <DollarSign className="w-5 h-5 text-white animate-pulse" />
//               </div>
//               <div>
//                 <h2 className="text-lg font-semibold text-gray-900">Currency Converter</h2>
//                 <p className="text-xs text-gray-600">Live exchange rates</p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               {lastUpdated && (
//                 <span className="text-xs text-gray-500">
//                   Updated {lastUpdated.toLocaleTimeString()}
//                 </span>
//               )}
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={(e) => {
//                   e.stopPropagation()
//                   refreshRates()
//                 }}
//                 className="p-1 h-6 w-6"
//               >
//                 <RefreshCw className="w-3 h-3 text-emerald-600" />
//               </Button>
//             </div>
//           </div>
//         </div>
        
//         {/* Clean Content Area */}
//         <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
//           <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
//             {/* Quick Converter */}
//             <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-emerald-200">
//               <div className="flex items-center justify-between mb-3">
//                 <h3 className="text-sm font-medium text-gray-700">Quick Convert</h3>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={(e) => {
//                     e.stopPropagation()
//                     swapCurrencies()
//                   }}
//                   className="p-1 h-6 w-6"
//                 >
//                   <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
//                 </Button>
//               </div>
              
//               {/* Amount Input */}
//               <div className="mb-3">
//                 <input
//                   type="number"
//                   value={amount}
//                   onChange={(e) => setAmount(Number(e.target.value))}
//                   className="w-full p-2 text-lg font-semibold border border-emerald-200 rounded-lg bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   placeholder="Enter amount"
//                   onClick={(e) => e.stopPropagation()}
//                 />
//               </div>
              
//               {/* Currency Selection */}
//               <div className="grid grid-cols-2 gap-2 mb-3">
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 mb-1 block">From</label>
//                   <select
//                     value={selectedFromCurrency}
//                     onChange={(e) => setSelectedFromCurrency(e.target.value)}
//                     className="w-full p-2 border border-emerald-200 rounded-lg bg-white/80 text-sm"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     {currencies.map(currency => (
//                       <option key={currency.code} value={currency.code}>
//                         {currency.flag} {currency.code}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-xs font-medium text-gray-600 mb-1 block">To</label>
//                   <select
//                     value={selectedToCurrency}
//                     onChange={(e) => setSelectedToCurrency(e.target.value)}
//                     className="w-full p-2 border border-emerald-200 rounded-lg bg-white/80 text-sm"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     {currencies.map(currency => (
//                       <option key={currency.code} value={currency.code}>
//                         {currency.flag} {currency.code}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
              
//               {/* Exchange Rate Display */}
//               <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200">
//                 <div className="text-center">
//                   <div className="text-xs text-gray-600 mb-1">Exchange Rate</div>
//                   <div className="text-2xl font-bold text-emerald-700">
//                     {isLoading ? (
//                       <Loader2 className="w-6 h-6 animate-spin mx-auto" />
//                     ) : exchangeRate ? (
//                       `1 ${selectedFromCurrency} = ${exchangeRate.toFixed(4)} ${selectedToCurrency}`
//                     ) : (
//                       'Loading...'
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Quick Amount Buttons */}
//             <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-emerald-200">
//               <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Amounts</h3>
//               <div className="grid grid-cols-3 gap-2">
//                 {[100, 500, 1000, 2000, 5000, 10000].map(quickAmount => (
//                   <Button
//                     key={quickAmount}
//                     variant="outline"
//                     size="sm"
//                     onClick={(e) => {
//                       e.stopPropagation()
//                       handleQuickAmount(quickAmount)
//                     }}
//                     className="text-xs h-8 bg-white/80 hover:bg-emerald-50 border-emerald-200"
//                   >
//                     {quickAmount.toLocaleString()}
//                   </Button>
//                 ))}
//               </div>
//             </div>

//             {/* Popular Pairs */}
//             <div className="bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-emerald-200">
//               <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Pairs</h3>
//               <div className="grid grid-cols-2 gap-2">
//                 {popularPairs.slice(0, 4).map((pair) => (
//                   <Button
//                     key={`${pair.from}-${pair.to}`}
//                     variant="ghost"
//                     size="sm"
//                     onClick={(e) => {
//                       e.stopPropagation()
//                       setSelectedFromCurrency(pair.from)
//                       setSelectedToCurrency(pair.to)
//                     }}
//                     className="h-12 bg-white/60 hover:bg-emerald-50 border border-emerald-200 rounded-lg"
//                   >
//                     <div className="text-left">
//                       <div className="text-xs font-semibold">{pair.from} → {pair.to}</div>
//                       <div className="text-sm font-bold text-emerald-600">{pair.rate}</div>
//                     </div>
//                   </Button>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//           </div>

//       {/* Expanded Modal */}
//       {showExpandedModal && (
//         <Dialog open={showExpandedModal} onOpenChange={setShowExpandedModal}>
//           <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden z-[100]">
//             <DialogHeader>
//               <DialogTitle className="flex items-center gap-2">
//                 <DollarSign className="w-6 h-6 text-emerald-500 animate-pulse" />
//                 Currency Converter - Full View
//               </DialogTitle>
//             </DialogHeader>
//             <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
//               <Tabs defaultValue="convert" className="w-full">
//                 <TabsList className="grid w-full grid-cols-5 mb-4">
//                   <TabsTrigger value="convert" className="flex items-center gap-2">
//                     <Calculator className="h-4 w-4" />
//                     Convert
//                 </TabsTrigger>
//                   <TabsTrigger value="trending" className="flex items-center gap-2">
//                     <TrendingUp className="h-4 w-4" />
//                     Trending
//                 </TabsTrigger>
//                   <TabsTrigger value="charts" className="flex items-center gap-2">
//                     <BarChart3 className="h-4 w-4" />
//                     Charts
//                 </TabsTrigger>
//                   <TabsTrigger value="favorites" className="flex items-center gap-2">
//                     <Heart className="h-4 w-4" />
//                     Favorites
//                 </TabsTrigger>
//                   <TabsTrigger value="tools" className="flex items-center gap-2">
//                     <Zap className="h-4 w-4" />
//                     Tools
//                 </TabsTrigger>
//               </TabsList>

//                 <TabsContent value="convert" className="mt-4">
//                   <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg border border-emerald-200">
//                 <Suspense
//                   fallback={
//                     <div className="flex items-center justify-center h-32">
//                           <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
//                     </div>
//                   }
//                 >
//                   <LazyConverter
//                     amount={amount}
//                     fromCurrency={selectedFromCurrency}
//                     toCurrency={selectedToCurrency}
//                     exchangeRate={exchangeRate}
//                     isLoading={isLoading}
//                     onAmountChange={setAmount}
//                     onCurrencyChange={(from, to) => {
//                       setSelectedFromCurrency(from);
//                       setSelectedToCurrency(to);
//                     }}
//                     currencies={currencies}
//                   />
//                 </Suspense>
//                   </div>
//               </TabsContent>

//                 <TabsContent value="trending" className="mt-4">
//                   <div className="space-y-6">
//                     <div className="text-center">
//                       <h3 className="text-xl font-semibold text-gray-800 mb-2">
//                       📈 Trending Currencies
//                       </h3>
//                       <p className="text-gray-600">
//                       Most popular currencies in Pattaya
//                       </p>
//                   </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {trendingCurrencies.slice(0, 10).map((currency) => (
//                       <Button
//                         key={currency.code}
//                         variant="ghost"
//                         onClick={() => handleTrendingCurrencyClick(currency.code)}
//                           className="w-full justify-between h-16 hover:bg-emerald-50 transition-all duration-200 border-2 border-gray-200 rounded-lg p-4 hover:border-emerald-300"
//                       >
//                           <div className="flex items-center gap-4">
//                             <div className="text-sm bg-emerald-100 rounded-full w-10 h-10 flex items-center justify-center font-bold text-emerald-700">
//                             #{currency.rank}
//                           </div>
//                           <div className="text-left">
//                             <div className="flex items-center gap-2">
//                                 <span className="text-2xl">{currency.flag}</span>
//                               <div>
//                                   <div className="font-mono text-lg font-bold text-gray-900">{currency.code}</div>
//                                   <div className="text-sm text-gray-600">{currency.name}</div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                         <div
//                             className="text-sm px-4 py-2 rounded-full font-bold"
//                           style={{
//                             backgroundColor: currency.trend.startsWith("+") ? "#22c55e" : "#ef4444",
//                             color: "#ffffff",
//                           }}
//                         >
//                           {currency.trend}
//                         </div>
//                       </Button>
//                     ))}
//                   </div>

//                     <div className="pt-6 border-t border-gray-200">
//                       <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Popular Pairs for Pattaya</h3>
//                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                         {popularPairs.map((pair) => (
//                           <div key={`${pair.from}-${pair.to}`} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-colors">
//                           <div className="flex items-center justify-between">
//                               <span className="font-mono text-lg font-semibold text-gray-800">
//                               {pair.from} → {pair.to}
//                             </span>
//                               <span className="font-bold text-xl text-emerald-600">{pair.rate}</span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </TabsContent>

//                 <TabsContent value="charts" className="mt-4">
//                   <div className="bg-white p-6 rounded-lg border border-gray-200">
//                   <Suspense
//                     fallback={
//                         <div className="flex items-center justify-center h-64">
//                           <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
//                       </div>
//                     }
//                   >
//                     <LazyChart 
//                       currencyPair={`${selectedFromCurrency}/${selectedToCurrency}`}
//                       historicalData={history?.history}
//                     />
//                   </Suspense>
//                 </div>
//               </TabsContent>

//                 <TabsContent value="favorites" className="mt-4">
//                   <div className="text-center space-y-6">
//                     <div className="text-xl font-semibold text-gray-800">❤️ My Favorites</div>
//                     <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-8 rounded-lg border-2 border-amber-200 text-center">
//                       <Heart className="h-16 w-16 mx-auto text-amber-600 mb-4" />
//                       <div className="text-xl text-amber-800 mb-4">Sign in to save your favorite currency pairs</div>
//                       <Button size="lg" className="text-lg h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
//                         Sign In
//                       </Button>
//                   </div>
//                 </div>
//               </TabsContent>

//                 <TabsContent value="tools" className="mt-4">
//                   <div className="space-y-6">
//                     <div className="text-center">
//                       <h3 className="text-xl font-semibold text-gray-800">🛠️ Currency Tools</h3>
//                       <p className="text-gray-600">Advanced currency utilities</p>
//                   </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       <Button variant="outline" size="lg" className="w-full justify-start text-lg h-16 bg-white border-2 hover:border-emerald-300 hover:bg-emerald-50">
//                       📊 Rate Alerts
//                     </Button>
//                       <Button variant="outline" size="lg" className="w-full justify-start text-lg h-16 bg-white border-2 hover:border-emerald-300 hover:bg-emerald-50">
//                       🧮 Travel Calculator
//                     </Button>
//                       <Button variant="outline" size="lg" className="w-full justify-start text-lg h-16 bg-white border-2 hover:border-emerald-300 hover:bg-emerald-50">
//                       💰 Savings Goal Tracker
//                     </Button>
//                       <Button variant="outline" size="lg" className="w-full justify-start text-lg h-16 bg-white border-2 hover:border-emerald-300 hover:bg-emerald-50">
//                       📈 Investment Calculator
//                     </Button>
//                   </div>

//                     <div className="pt-6 border-t border-gray-200">
//                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg text-center border-2 border-blue-200">
//                         <div className="text-lg text-blue-800 font-semibold mb-2">Sponsored by ExchangeRate-API</div>
//                         <div className="text-sm text-blue-600">Free • Reliable • Fast</div>
//                     </div>
//                   </div>
//                 </div>
//               </TabsContent>
//             </Tabs>
//           </div>
//           </DialogContent>
//         </Dialog>
//         )}
//     </>
//   );
// }


"use client";

import type React from "react";

import { useState, useEffect, lazy, Suspense, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, BarChart3, Heart, Zap, Loader2, AlertCircle, ArrowRightLeft, DollarSign, Coins, Calculator, Sparkles, Star, RefreshCw, TrendingDown } from "lucide-react";
import { useCurrencyConverter, useCurrencyConversion, useCurrencyHistory } from '@/hooks/use-currency-converter';
import { WidgetWrapper } from './WidgetWrapper';
import { SponsorshipBanner } from './sponsorship-banner';

const LazyChart = lazy(() => import("./lazy-chart").then((module) => ({ default: module.LazyChart })));
const LazyConverter = lazy(() => import("./lazy-converter").then((module) => ({ default: module.LazyConverter })));

// Default trending currencies (will be replaced with real data from API)
const DEFAULT_TRENDING_CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸", trend: "+1.8%", rank: 2 },
  { code: "THB", name: "Thai Baht", flag: "🇹🇭", trend: "+2.3%", rank: 1 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", trend: "+0.9%", rank: 3 },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", trend: "+1.2%", rank: 4 },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", trend: "-0.5%", rank: 5 },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", trend: "+0.7%", rank: 6 },
  { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", trend: "+1.1%", rank: 7 },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", trend: "-0.3%", rank: 8 },
  { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", trend: "+0.4%", rank: 9 },
  { code: "KRW", name: "South Korean Won", flag: "🇰🇷", trend: "+0.8%", rank: 10 },
];

// Default popular pairs (will be replaced with real rates from API)
const DEFAULT_POPULAR_PAIRS = [
  { from: "USD", to: "THB", rate: "31.76" },
  { from: "EUR", to: "THB", rate: "37.18" },
  { from: "GBP", to: "THB", rate: "42.98" },
  { from: "JPY", to: "THB", rate: "0.216" },
  { from: "CNY", to: "THB", rate: "4.46" },
  { from: "SGD", to: "THB", rate: "24.81" },
];

interface CurrencyConverterWidgetProps {
  onCurrencySelect?: (from: string, to: string) => void;
  showCharts?: boolean;
  compact?: boolean;
  theme?: 'primary' | 'nightlife';
  className?: string;
}

export function CurrencyConverterWidget({ onCurrencySelect, showCharts = true, compact = true, theme = 'primary', className }: CurrencyConverterWidgetProps) {
  const { currencies, rates, settings, loading: initialLoading, error: initialError, refreshRates } = useCurrencyConverter();
  const { result, loading: converting, error: convertError, convert, clearResult } = useCurrencyConversion();
  const { history, loading: historyLoading, error: historyError, fetchHistory, clearHistory } = useCurrencyHistory();
  
  const [selectedFromCurrency, setSelectedFromCurrency] = useState("USD");
  const [selectedToCurrency, setSelectedToCurrency] = useState("THB");
  const [amount, setAmount] = useState(1000);
  const [isLoading, setIsLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showExpandedModal, setShowExpandedModal] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [activeTab, setActiveTab] = useState("convert");

  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<"horizontal" | "vertical" | "both" | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startDimensions = useRef({ width: 0, height: 0 });

  const isPrimary = theme === 'primary';

  // Generate trending currencies from real API data
  const getTrendingCurrencies = () => {
    if (currencies.length === 0) return DEFAULT_TRENDING_CURRENCIES;
    
    // Get top currencies with mock trend data (in production, this would come from real analytics)
    const topCurrencies = currencies.slice(0, 10).map((currency, index) => ({
      code: currency.code,
      name: currency.name,
      flag: currency.flag,
      trend: index % 3 === 0 ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%` : 
             index % 3 === 1 ? `-${(Math.random() * 1 + 0.2).toFixed(1)}%` : 
             `+${(Math.random() * 1.5 + 0.3).toFixed(1)}%`,
      rank: index + 1
    }));
    
    return topCurrencies;
  };

  const trendingCurrencies = getTrendingCurrencies();

  // Generate popular pairs from real exchange rates
  const getPopularPairs = () => {
    if (!rates?.rates) return DEFAULT_POPULAR_PAIRS;
    
    const popularPairs = [
      { from: "USD", to: "THB" },
      { from: "EUR", to: "THB" },
      { from: "GBP", to: "THB" },
      { from: "JPY", to: "THB" },
      { from: "CNY", to: "THB" },
      { from: "SGD", to: "THB" },
    ];
    
    return popularPairs.map(pair => {
      // For pairs like USD to THB, the rate is directly from rates.rates[USD]
      const rate = rates.rates[pair.from] || 1;
      return {
        ...pair,
        rate: rate.toFixed(4)
      };
    });
  };

  const popularPairs = getPopularPairs();

  // Load historical data for charts
  const loadHistoricalData = useCallback(async () => {
    if (selectedFromCurrency && selectedToCurrency && selectedFromCurrency !== selectedToCurrency) {
      try {
        await fetchHistory(selectedToCurrency, 7);
      } catch (error) {
        console.error('Failed to load historical data:', error);
      }
    }
  }, [selectedFromCurrency, selectedToCurrency, fetchHistory]);

  // Initialize with settings
  useEffect(() => {
    if (settings) {
      setSelectedFromCurrency(settings.defaultFromCurrency);
      setSelectedToCurrency(settings.defaultToCurrency);
    }
  }, [settings]);

  // Update last updated timestamp when rates change
  useEffect(() => {
    if (rates?.timestamp) {
      setLastUpdated(new Date(rates.timestamp));
    }
  }, [rates]);

  // Load exchange rate using real API
  useEffect(() => {
    const loadExchangeRate = async () => {
      if (selectedFromCurrency === selectedToCurrency) {
        setExchangeRate(1);
        return;
      }

      setIsLoading(true);
      try {
        // Use the real API to convert currency
        const result = await convert(selectedFromCurrency, selectedToCurrency, 1);
        if (result) {
          setExchangeRate(result.rate);
        } else if (rates && rates.rates) {
          // Backend uses THB as base currency, rates are "THB per unit of other currency"
          let calculatedRate;
          
          if (selectedFromCurrency === 'THB') {
            // Converting from THB to another currency: divide by rate
            calculatedRate = 1 / (rates.rates[selectedToCurrency] || 1);
          } else if (selectedToCurrency === 'THB') {
            // Converting from another currency to THB: multiply by rate
            calculatedRate = rates.rates[selectedFromCurrency] || 1;
          } else {
            // Converting between two non-THB currencies: convert via THB
            const fromRate = rates.rates[selectedFromCurrency] || 1;
            const toRate = rates.rates[selectedToCurrency] || 1;
            calculatedRate = fromRate / toRate;
          }
          
          setExchangeRate(calculatedRate);
        }
      } catch (error) {
        console.error("Failed to load exchange rate:", error);
        // Fallback to mock data only if API completely fails
        setExchangeRate(selectedFromCurrency === 'THB' ? 0.03176 : 31.76);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedFromCurrency && selectedToCurrency) {
      loadExchangeRate();
    }
  }, [selectedFromCurrency, selectedToCurrency, rates, convert]);

  // Load historical data when currencies change
  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  const handleTrendingCurrencyClick = (currencyCode: string) => {
    if (selectedFromCurrency === currencyCode) {
      setSelectedToCurrency(currencyCode);
      setSelectedFromCurrency(selectedToCurrency);
    } else {
      setSelectedToCurrency(currencyCode);
    }
    onCurrencySelect?.(selectedFromCurrency, currencyCode);
  };

  const handleQuickAmount = (newAmount: number) => {
    setAmount(newAmount);
  };

  const swapCurrencies = () => {
    setSelectedFromCurrency(selectedToCurrency);
    setSelectedToCurrency(selectedFromCurrency);
  };

  const handleMouseDown = (e: React.MouseEvent, direction: "horizontal" | "vertical" | "both") => {
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startDimensions.current = { ...dimensions };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    const newDimensions = { ...startDimensions.current };

    if (resizeDirection === "horizontal" || resizeDirection === "both") {
      newDimensions.width = Math.max(280, Math.min(600, startDimensions.current.width + deltaX));
    }

    if (resizeDirection === "vertical" || resizeDirection === "both") {
      newDimensions.height = Math.max(350, Math.min(800, startDimensions.current.height + deltaY));
    }

    setDimensions(newDimensions);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizeDirection(null);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  if (initialError) {
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden rounded-xl">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/30 via-transparent to-rose-100/30 backdrop-blur-3xl"></div>
        </div>
        
        {/* Floating Elements */}
        <AlertCircle className="absolute top-4 left-4 w-6 h-6 text-red-300 opacity-60 animate-pulse" />
        <RefreshCw className="absolute top-6 right-8 w-4 h-4 text-rose-400 opacity-40 animate-spin" />
        <TrendingDown className="absolute bottom-8 left-6 w-5 h-5 text-pink-300 opacity-50 animate-bounce" />
        
        <div className="text-center relative z-10 p-8 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <p className="text-lg font-semibold mb-4 text-gray-800">Failed to load currency converter</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshRates}
            className="bg-white/30 backdrop-blur-sm hover:bg-white/50 border-red-200/50 text-red-700 transition-all duration-300 hover:scale-105"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Widget - Enhanced with Glassmorphism */}
      <div 
        className="h-full flex flex-col relative overflow-hidden rounded-2xl cursor-pointer group transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
        onClick={() => setShowExpandedModal(true)}
      >
        {/* Animated Background with Glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/20 via-transparent to-teal-100/20 backdrop-blur-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent backdrop-blur-xl"></div>
        </div>

        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/20 rounded-full animate-float"></div>
          <div className="absolute top-1/4 -right-2 w-6 h-6 bg-emerald-200/30 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-teal-300/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 bg-cyan-200/20 rounded-full animate-float-slow"></div>
        </div>

        {/* Header with Enhanced Glassmorphism - Compact */}
        <div className="relative p-2 border-b border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl overflow-hidden">
          {/* Animated Background Icons */}
          <DollarSign className="absolute top-1 left-1 w-3 h-3 text-white/40 animate-pulse" />
          <Coins className="absolute top-2 right-2 w-4 h-4 text-emerald-200/60 animate-bounce" style={{ animationDelay: '0.5s' }} />
          <TrendingUp className="absolute bottom-1 left-4 w-3 h-3 text-teal-300/50 animate-pulse" style={{ animationDelay: '1s' }} />
          <Star className="absolute bottom-1 right-1 w-3 h-3 text-cyan-200/40 animate-ping" style={{ animationDelay: '1.5s' }} />
          <Sparkles className="absolute top-1 right-6 w-3 h-3 text-emerald-300/60 animate-spin" style={{ animationDelay: '2s', animationDuration: '3s' }} />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className="relative p-2 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-4 h-4 text-white animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-xl blur-xl animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white drop-shadow-lg">Currency Converter</h2>
                <p className="text-xs text-white/80 font-medium">Live rates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-white/70 font-medium bg-white/10 backdrop-blur-xl px-2 py-1 rounded-full border border-white/20">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  refreshRates()
                }}
                className="p-1 h-6 w-6 bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/30 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <RefreshCw className="w-3 h-3 text-white" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content with Enhanced Glassmorphism - Compact with Tabs */}
        <div className="flex-1 overflow-y-auto p-1.5 relative z-10 h-full">
          <div className="space-y-3 h-full" onClick={(e) => e.stopPropagation()}>
            {/* Compact Tabs */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
              <div className="relative p-1.5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-1 mb-3">
                    <TabsTrigger value="convert" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-md transition-all duration-300 text-xs py-1">
                      <Calculator className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="trending" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-md transition-all duration-300 text-xs py-1">
                      <TrendingUp className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-md transition-all duration-300 text-xs py-1">
                      <Heart className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="flex items-center gap-1 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-md transition-all duration-300 text-xs py-1">
                      <Zap className="h-3 w-3" />
                    </TabsTrigger>
                  </TabsList>

                  {/* Convert Tab Content */}
                  <TabsContent value="convert" className="space-y-3 flex-1 overflow-y-auto">
                    {/* Quick Converter with Glassmorphism - Compact */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
                      <div className="relative p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-white drop-shadow-sm">Quick Convert</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              swapCurrencies()
                            }}
                            className="p-1 h-6 w-6 bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/30 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-180"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-white" />
                          </Button>
                        </div>
                        
                        {/* Amount Input with Glassmorphism - Compact */}
                        <div className="relative">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full p-2 text-lg font-bold bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all duration-300"
                            placeholder="Enter amount"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl pointer-events-none"></div>
                        </div>
                        
                        {/* Currency Selection with Glassmorphism - Compact */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-white/90 mb-1 block">From</label>
                            <select
                              value={selectedFromCurrency}
                              onChange={(e) => setSelectedFromCurrency(e.target.value)}
                              className="w-full p-2 bg-white/10 backdrop-blur-xl border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all duration-300 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {currencies.map(currency => (
                                <option key={currency.code} value={currency.code} className="bg-gray-800 text-white">
                                  {currency.flag} {currency.code}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-white/90 mb-1 block">To</label>
                            <select
                              value={selectedToCurrency}
                              onChange={(e) => setSelectedToCurrency(e.target.value)}
                              className="w-full p-2 bg-white/10 backdrop-blur-xl border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all duration-300 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {currencies.map(currency => (
                                <option key={currency.code} value={currency.code} className="bg-gray-800 text-white">
                                  {currency.flag} {currency.code}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        {/* Exchange Rate Display with Enhanced Glassmorphism - Compact */}
                        <div className="relative overflow-hidden rounded-xl">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 backdrop-blur-xl border border-white/40"></div>
                          <div className="relative p-3 text-center">
                            <div className="text-xs text-white/80 font-medium mb-1">Exchange Rate</div>
                            <div className="text-lg font-bold text-white drop-shadow-lg">
                              {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
                              ) : exchangeRate ? (
                                <span className="animate-fade-in">
                                  1 {selectedFromCurrency} = {exchangeRate.toFixed(4)} {selectedToCurrency}
                                </span>
                              ) : (
                                <span className="animate-pulse">Loading...</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Amount Buttons with Glassmorphism - Compact */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
                      <div className="relative p-3">
                        <h3 className="text-sm font-semibold text-white mb-2 drop-shadow-sm">Quick Amounts</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {[100, 500, 1000, 2000, 5000, 10000].map(quickAmount => (
                            <Button
                              key={quickAmount}
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickAmount(quickAmount)
                              }}
                              className="h-7 bg-white/10 backdrop-blur-xl hover:bg-white/20 border-white/30 text-white font-semibold transition-all duration-300 hover:scale-105 rounded-lg text-xs"
                            >
                              {quickAmount.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Popular Pairs with Enhanced Glassmorphism - Compact */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
                      <div className="relative p-3">
                        <h3 className="text-sm font-semibold text-white mb-2 drop-shadow-sm">Popular Pairs</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {popularPairs.slice(0, 4).map((pair) => (
                            <Button
                              key={`${pair.from}-${pair.to}`}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFromCurrency(pair.from)
                                setSelectedToCurrency(pair.to)
                              }}
                              className="h-12 bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/30 text-white transition-all duration-300 hover:scale-105 rounded-lg group"
                            >
                              <div className="text-left">
                                <div className="text-xs font-semibold text-white/90 group-hover:text-white transition-colors">{pair.from} → {pair.to}</div>
                                <div className="text-sm font-bold text-white drop-shadow-sm">{pair.rate}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Trending Tab Content */}
                  <TabsContent value="trending" className="space-y-3 flex-1 overflow-y-auto">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
                      <div className="relative p-3">
                        <h3 className="text-sm font-semibold text-white mb-3 drop-shadow-sm">📈 Trending Currencies</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {trendingCurrencies.slice(0, 6).map((currency, index) => (
                            <Button
                              key={currency.code}
                              variant="ghost"
                              onClick={() => handleTrendingCurrencyClick(currency.code)}
                              className="w-full justify-between h-12 bg-white/5 backdrop-blur-xl hover:bg-white/15 transition-all duration-300 border border-white/20 rounded-lg p-2 hover:border-white/40 hover:scale-105 group"
                            >
                              <div className="flex items-center gap-2">
                                <div className="text-xs bg-gradient-to-br from-emerald-400/20 to-teal-500/20 backdrop-blur-xl rounded-full w-6 h-6 flex items-center justify-center font-bold text-emerald-300 border border-white/30">
                                  {currency.rank}
                                </div>
                                <div className="text-left">
                                  <div className="flex items-center gap-1">
                                    <span className="text-lg">{currency.flag}</span>
                                    <div>
                                      <div className="font-mono text-sm font-bold text-white group-hover:text-emerald-300 transition-colors duration-300">{currency.code}</div>
                                      <div className="text-xs text-white/70 group-hover:text-white/90 transition-colors duration-300">{currency.name}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div
                                className="text-xs px-2 py-1 rounded-full font-bold backdrop-blur-xl border transition-all duration-300 group-hover:scale-110"
                                style={{
                                  backgroundColor: currency.trend.startsWith("+") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                  color: currency.trend.startsWith("+") ? "#22c55e" : "#ef4444",
                                  borderColor: currency.trend.startsWith("+") ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
                                }}
                              >
                                {currency.trend}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>


                  {/* Favorites Tab Content */}
                  <TabsContent value="favorites" className="space-y-3 flex-1 overflow-y-auto">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
                      <div className="relative p-3 text-center">
                        <div className="text-2xl mb-3">❤️</div>
                        <div className="text-sm text-white/80 mb-3">Sign in to save your favorite currency pairs</div>
                        <Button size="sm" className="text-sm h-8 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                          Sign In
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tools Tab Content */}
                  <TabsContent value="tools" className="space-y-3 flex-1 overflow-y-auto">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl"></div>
                      <div className="relative p-3">
                        <h3 className="text-sm font-semibold text-white mb-3 drop-shadow-sm">🛠️ Currency Tools</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: "📊", title: "Rate Alerts" },
                            { icon: "🧮", title: "Travel Calc" },
                            { icon: "💰", title: "Savings" },
                            { icon: "📈", title: "Investment" }
                          ].map((tool) => (
                            <Button 
                              key={tool.title}
                              variant="outline" 
                              size="sm" 
                              className="w-full justify-start text-xs h-10 bg-white/5 backdrop-blur-xl border border-white/20 hover:border-white/40 hover:bg-white/15 text-white rounded-lg transition-all duration-300 hover:scale-105 group"
                            >
                              <span className="text-sm mr-2 group-hover:scale-110 transition-transform duration-300">{tool.icon}</span>
                              <span className="font-semibold">{tool.title}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Modal with Glassmorphism */}
      {showExpandedModal && (
        <Dialog open={showExpandedModal} onOpenChange={setShowExpandedModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden z-[100] border-0 bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-black/95 backdrop-blur-2xl shadow-2xl">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent backdrop-blur-xl"></div>
            </div>

            <DialogHeader className="relative z-10">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-xl border border-white/20">
                    <DollarSign className="w-7 h-7 text-emerald-400 animate-pulse" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-bold">
                    Currency Converter - Full View
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactView(!compactView)}
                  className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                >
                  {compactView ? 'Full View' : 'Compact View'}
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] relative z-10">
              <Tabs defaultValue="convert" className="w-full">
                <TabsList className={`grid w-full grid-cols-5 ${compactView ? 'mb-3' : 'mb-6'} bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-1`}>
                  <TabsTrigger value="convert" className={`flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-300 ${compactView ? 'text-xs py-1' : ''}`}>
                    <Calculator className={`${compactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {!compactView && 'Convert'}
                  </TabsTrigger>
                  <TabsTrigger value="trending" className={`flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-300 ${compactView ? 'text-xs py-1' : ''}`}>
                    <TrendingUp className={`${compactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {!compactView && 'Trending'}
                  </TabsTrigger>
                  <TabsTrigger value="charts" className={`flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-300 ${compactView ? 'text-xs py-1' : ''}`}>
                    <BarChart3 className={`${compactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {!compactView && 'Charts'}
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className={`flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-300 ${compactView ? 'text-xs py-1' : ''}`}>
                    <Heart className={`${compactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {!compactView && 'Favorites'}
                  </TabsTrigger>
                  <TabsTrigger value="tools" className={`flex items-center gap-2 text-white data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-xl transition-all duration-300 ${compactView ? 'text-xs py-1' : ''}`}>
                    <Zap className={`${compactView ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    {!compactView && 'Tools'}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="convert" className="mt-6">
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20"></div>
                    <div className="relative p-8">
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center h-32">
                            <div className="relative">
                              <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
                              <div className="absolute inset-0 h-12 w-12 rounded-full bg-emerald-400/20 animate-ping"></div>
                            </div>
                          </div>
                        }
                      >
                        <LazyConverter
                          amount={amount}
                          fromCurrency={selectedFromCurrency}
                          toCurrency={selectedToCurrency}
                          exchangeRate={exchangeRate}
                          isLoading={isLoading}
                          onAmountChange={setAmount}
                          onCurrencyChange={(from, to) => {
                            setSelectedFromCurrency(from);
                            setSelectedToCurrency(to);
                          }}
                          currencies={currencies}
                        />
                      </Suspense>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trending" className="mt-6">
                  <div className="space-y-8">
                    <div className="text-center relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent backdrop-blur-xl rounded-2xl"></div>
                      <div className="relative p-6">
                        <h3 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                          📈 Trending Currencies
                        </h3>
                        <p className="text-white/80 text-lg">
                          Most popular currencies in Pattaya
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {trendingCurrencies.slice(0, 10).map((currency, index) => (
                        <div key={currency.code} className="group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                          <Button
                            variant="ghost"
                            onClick={() => handleTrendingCurrencyClick(currency.code)}
                            className="w-full justify-between h-20 bg-white/5 backdrop-blur-xl hover:bg-white/15 transition-all duration-300 border-2 border-white/20 rounded-2xl p-6 hover:border-white/40 hover:scale-105 group"
                          >
                            <div className="flex items-center gap-5">
                              <div className="text-sm bg-gradient-to-br from-emerald-400/20 to-teal-500/20 backdrop-blur-xl rounded-full w-12 h-12 flex items-center justify-center font-bold text-emerald-300 border border-white/30 group-hover:scale-110 transition-transform duration-300">
                                #{currency.rank}
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>{currency.flag}</span>
                                  <div>
                                    <div className="font-mono text-xl font-bold text-white group-hover:text-emerald-300 transition-colors duration-300">{currency.code}</div>
                                    <div className="text-sm text-white/70 group-hover:text-white/90 transition-colors duration-300">{currency.name}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div
                              className="text-sm px-4 py-2 rounded-full font-bold backdrop-blur-xl border transition-all duration-300 group-hover:scale-110"
                              style={{
                                backgroundColor: currency.trend.startsWith("+") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                color: currency.trend.startsWith("+") ? "#22c55e" : "#ef4444",
                                borderColor: currency.trend.startsWith("+") ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
                              }}
                            >
                              {currency.trend}
                            </div>
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-white/20">
                      <div className="relative overflow-hidden rounded-2xl mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl"></div>
                        <div className="relative p-6">
                          <h3 className="text-2xl font-bold text-white text-center drop-shadow-lg">Popular Pairs for Pattaya</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {popularPairs.map((pair, index) => (
                          <div key={`${pair.from}-${pair.to}`} className="group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105 cursor-pointer group-hover:bg-white/10">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors duration-300">
                                  {pair.from} → {pair.to}
                                </span>
                                <span className="font-bold text-2xl text-emerald-400 drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{pair.rate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="charts" className="mt-6">
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl border border-white/20"></div>
                    <div className="relative p-8">
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center h-64">
                            <div className="relative">
                              <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
                              <div className="absolute inset-0 h-12 w-12 rounded-full bg-emerald-400/20 animate-ping"></div>
                            </div>
                          </div>
                        }
                      >
                        <LazyChart 
                          currencyPair={`${selectedFromCurrency}/${selectedToCurrency}`}
                          historicalData={history?.history}
                        />
                      </Suspense>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="favorites" className="mt-6">
                  <div className="text-center space-y-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent backdrop-blur-xl rounded-2xl"></div>
                      <div className="relative p-6">
                        <div className="text-3xl font-bold text-white drop-shadow-lg">❤️ My Favorites</div>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 backdrop-blur-xl border border-amber-400/30"></div>
                      <div className="relative p-12 text-center">
                        <div className="relative inline-block mb-6">
                          <Heart className="h-20 w-20 mx-auto text-amber-400 animate-pulse" />
                          <div className="absolute inset-0 h-20 w-20 bg-amber-400/20 rounded-full animate-ping mx-auto"></div>
                        </div>
                        <div className="text-2xl text-amber-300 mb-6 font-semibold drop-shadow-lg">Sign in to save your favorite currency pairs</div>
                        <Button size="lg" className="text-xl h-14 px-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl">
                          Sign In
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="mt-6">
                  <div className="space-y-8">
                    <div className="text-center relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent backdrop-blur-xl rounded-2xl"></div>
                      <div className="relative p-6">
                        <h3 className="text-3xl font-bold text-white drop-shadow-lg">🛠️ Currency Tools</h3>
                        <p className="text-white/80 text-lg">Advanced currency utilities</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { icon: "📊", title: "Rate Alerts", delay: "0s" },
                        { icon: "🧮", title: "Travel Calculator", delay: "0.1s" },
                        { icon: "💰", title: "Savings Goal Tracker", delay: "0.2s" },
                        { icon: "📈", title: "Investment Calculator", delay: "0.3s" }
                      ].map((tool, index) => (
                        <div key={tool.title} className="animate-fade-in" style={{ animationDelay: tool.delay }}>
                          <Button 
                            variant="outline" 
                            size="lg" 
                            className="w-full justify-start text-xl h-20 bg-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/15 text-white rounded-2xl transition-all duration-300 hover:scale-105 group"
                          >
                            <span className="text-3xl mr-4 group-hover:scale-110 transition-transform duration-300">{tool.icon}</span>
                            <span className="font-semibold">{tool.title}</span>
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-white/20">
                      <div className="relative overflow-hidden rounded-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-blue-400/30"></div>
                        <div className="relative p-8 text-center">
                          <div className="text-2xl text-blue-300 font-bold mb-3 drop-shadow-lg">Sponsored by ExchangeRate-API</div>
                          <div className="text-lg text-blue-400/80 font-medium">Free • Reliable • Fast</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-180deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
}