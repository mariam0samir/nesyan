import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const T = {
  ar: {
    home: 'الرئيسية', shop: 'المتجر', women: 'نسائي', men: 'رجالي', unisex: 'للجنسين', oud: 'شتوية ودافئة', sets: 'ليلية فاخرة', about: 'عن نسيان', contact: 'تواصل معنا',
    allPerfumes: 'كل العطور', byGender: 'حسب النوع', byFamily: 'حسب الموسم', featured: 'مختارات', search: 'ابحث عن عطر أو نوتة…', searchTitle: 'بحث',
    cart: 'سلة التسوق', wishlist: 'المفضلة', lang: 'English', menu: 'القائمة', close: 'إغلاق', next: 'التالي', prev: 'السابق',
    addToCart: 'أضف للسلة', added: 'تمت الإضافة ✓', buyNow: 'اشترِ الآن', orderWhatsapp: 'اطلب عبر واتساب', outOfStock: 'غير متوفر حاليًا',
    from: 'من', egp: 'ج.م', askPrice: 'السعر عند الطلب', shipLater: 'يُحدَّد عند التأكيد', inspired: 'عطر مستوحى', collection: 'المجموعة', character: 'الطابع', size: 'الحجم', qty: 'الكمية', subtotal: 'المجموع الفرعي', shipping: 'الشحن', total: 'الإجمالي', free: 'مجاني',
    checkout: 'إتمام الطلب', continueShopping: 'متابعة التسوق', emptyCart: 'سلتك فاضية', emptyCartText: 'اكتشف عطورنا وابدأ رحلتك.', remove: 'حذف',
    freeShipLeft: 'باقي {x} على الشحن المجاني', freeShipDone: 'مبروك! طلبك شحنه مجاني 🎉',
    viewAll: 'عرض الكل', shopNow: 'تسوّق الآن', discover: 'اكتشف', learnMore: 'اعرف أكتر', viewProduct: 'عرض المنتج',
    top: 'المقدمة', heart: 'القلب', base: 'القاعدة', head: 'الرأس', notes: 'النوتات العطرية', pyramid: 'الهرم العطري',
    gender: 'النوع', concentration: 'التركيز', family: 'المجموعة', year: 'الإصدار', longevity: 'الثبات', sillage: 'الفوحان',
    story: 'الحكاية', howToUse: 'طريقة الاستخدام', shippingReturns: 'الشحن والاسترجاع',
    howToUseText: 'رشّ العطر على نقاط النبض: الرسغ، خلف الأذن وأسفل الرقبة، من مسافة 15 سم. لا تفرك العطر بعد الرش ليحتفظ بنوتاته.',
    shippingText: 'مصاريف ومدة التوصيل بتتحدد معاك عند تأكيد الطلب على واتساب.',
    youMayLike: 'قد يعجبك أيضًا', boughtTogether: 'يُشترى معًا غالبًا', priceForAll: 'السعر للكل', addAll: 'أضف الكل للسلة',
    new: 'جديد', exclusive: 'حصري', bestseller: 'الأكثر مبيعًا', sale: 'خصم',
    filters: 'الفلاتر', clearAll: 'مسح الكل', price: 'السعر', inStock: 'المتوفر فقط', sortBy: 'ترتيب حسب', showing: 'عرض {a} من {b} منتج',
    sortFeatured: 'المميز', sortNew: 'الأحدث', sortPriceAsc: 'السعر: من الأقل', sortPriceDesc: 'السعر: من الأعلى', sortName: 'الاسم',
    loadMore: 'تحميل المزيد', noResults: 'مفيش عطور بالمواصفات دي. جرّب تغيّر الفلاتر.', results: 'نتائج', apply: 'تطبيق',
    name: 'الاسم', phone: 'رقم الموبايل', email: 'الإيميل (اختياري)', governorate: 'المحافظة', city: 'المدينة / المنطقة', address: 'العنوان بالتفصيل', notes2: 'ملاحظات (اختياري)',
    payment: 'طريقة الدفع', cod: 'الدفع عند الاستلام', transfer: 'تحويل (InstaPay / فودافون كاش)', placeOrder: 'تأكيد الطلب', placing: 'جارٍ إرسال الطلب…',
    orderSummary: 'ملخص الطلب', shippingInfo: 'بيانات التوصيل', giftWrap: 'تغليف هدية مع كارت', giftNote: 'رسالة الكارت',
    orderDone: 'تم استلام طلبك!', orderNo: 'رقم الطلب', orderDoneText: 'هنتواصل معاك على الموبايل لتأكيد الطلب وموعد التوصيل.', confirmWhatsapp: 'أكّد الطلب على واتساب',
    required: 'من فضلك املأ الخانات المطلوبة.', badPhone: 'اكتب رقم موبايل صحيح — أرقام فقط (11 رقم).', failed: 'تعذر إرسال الطلب. جرّب تاني أو اطلب على واتساب.',
    send: 'إرسال', sending: 'جارٍ الإرسال…', sent: 'تم الإرسال، شكرًا لك! هنرد عليك قريبًا.', message: 'رسالتك',
    newsletter: 'النشرة البريدية', newsletterText: 'اشترك لتعرف أول بأول الإصدارات الجديدة والعروض الحصرية.', subscribe: 'اشترك', subscribed: 'تم الاشتراك ✓', yourEmail: 'بريدك الإلكتروني',
    aboutShort: 'نسيان .. عطر يبقى في الذاكرة. عطور مستوحاة بتركيز عالي وثبات طويل وفوحان مميز، وإصدارات نسيان الخاصة.',
    followUs: 'تابعنا', customerCare: 'خدمة العملاء', information: 'معلومات', rights: 'كل الحقوق محفوظة',
    finderTitle: 'اكتشف عطرك المميز', finderQ1: 'العطر لمين؟', finderQ2: 'بتحب العطر لأنهي موسم؟', finderQ3: 'تحب العطر يكون…', light: 'خفيف وقريب', medium: 'متوسط', strong: 'قوي وفوّاح',
    forMe: 'ليّ', forHer: 'لها', forHim: 'له', anyone: 'للجميع', yourMatches: 'العطور المناسبة لك', again: 'ابدأ من جديد',
    notFound: 'الصفحة مش موجودة', backHome: 'رجوع للرئيسية', wishlistEmpty: 'لسه ما ضفتش عطور للمفضلة.',
    flip: 'شوف العلبة', bottle: 'الزجاجة', box: 'العلبة', both: 'الزجاجة والعلبة', inYourCart: 'في سلتك', items: 'منتجات',
    whatsappMsg: 'مرحبًا نسيان، عايز أطلب:', backTop: 'لأعلى', results2: 'نتائج البحث', typeToSearch: 'اكتب اسم عطر أو نوتة مثل «عود» أو «فانيليا»',
    contactTitle: 'تواصل معنا', contactText: 'عندك سؤال عن عطر أو طلب؟ ابعتلنا وهنرد عليك في أسرع وقت.', hours: 'مواعيد العمل', ourValues: 'ما يميزنا',
  },
  en: {
    home: 'Home', shop: 'Shop', women: 'Women', men: 'Men', unisex: 'Unisex', oud: 'Winter & Warm', sets: 'Winter & Night', about: 'Our story', contact: 'Contact',
    allPerfumes: 'All perfumes', byGender: 'By gender', byFamily: 'By season', featured: 'Featured', search: 'Search a perfume or note…', searchTitle: 'Search',
    cart: 'Shopping bag', wishlist: 'Wishlist', lang: 'عربي', menu: 'Menu', close: 'Close', next: 'Next', prev: 'Previous',
    addToCart: 'Add to bag', added: 'Added ✓', buyNow: 'Buy now', orderWhatsapp: 'Order on WhatsApp', outOfStock: 'Out of stock',
    from: 'From', egp: 'EGP', askPrice: 'Price on request', shipLater: 'Confirmed with your order', inspired: 'Inspired scent', collection: 'Collection', character: 'Character', size: 'Size', qty: 'Qty', subtotal: 'Subtotal', shipping: 'Shipping', total: 'Total', free: 'Free',
    checkout: 'Checkout', continueShopping: 'Continue shopping', emptyCart: 'Your bag is empty', emptyCartText: 'Discover our scents and start your journey.', remove: 'Remove',
    freeShipLeft: '{x} away from free shipping', freeShipDone: 'Your order ships free 🎉',
    viewAll: 'View all', shopNow: 'Shop now', discover: 'Discover', learnMore: 'Learn more', viewProduct: 'View product',
    top: 'Top', heart: 'Heart', base: 'Base', head: 'Head', notes: 'Fragrance notes', pyramid: 'Olfactory pyramid',
    gender: 'Gender', concentration: 'Concentration', family: 'Collection', year: 'Released', longevity: 'Longevity', sillage: 'Sillage',
    story: 'The scoop', howToUse: 'How to use', shippingReturns: 'Shipping & returns',
    howToUseText: 'Spray on pulse points — wrists, behind the ears and the base of the neck — from 15 cm. Do not rub after spraying to keep the notes intact.',
    shippingText: 'Shipping fee and delivery time are confirmed with you on WhatsApp when you order.',
    youMayLike: 'You may also like', boughtTogether: 'Frequently bought together', priceForAll: 'Price for all', addAll: 'Add all to bag',
    new: 'New in', exclusive: 'Exclusivity', bestseller: 'Best seller', sale: 'Sale',
    filters: 'Filters', clearAll: 'Clear all', price: 'Price', inStock: 'In stock only', sortBy: 'Sort by', showing: 'Showing {a} of {b} products',
    sortFeatured: 'Featured', sortNew: 'Newest', sortPriceAsc: 'Price: low to high', sortPriceDesc: 'Price: high to low', sortName: 'Name',
    loadMore: 'Load more', noResults: 'No perfumes match these filters. Try changing them.', results: 'results', apply: 'Apply',
    name: 'Full name', phone: 'Mobile number', email: 'Email (optional)', governorate: 'Governorate', city: 'City / area', address: 'Detailed address', notes2: 'Notes (optional)',
    payment: 'Payment method', cod: 'Cash on delivery', transfer: 'Transfer (InstaPay / Vodafone Cash)', placeOrder: 'Place order', placing: 'Placing order…',
    orderSummary: 'Order summary', shippingInfo: 'Delivery details', giftWrap: 'Gift wrapping with a card', giftNote: 'Card message',
    orderDone: 'Order received!', orderNo: 'Order number', orderDoneText: 'We will call you to confirm your order and delivery time.', confirmWhatsapp: 'Confirm on WhatsApp',
    required: 'Please fill in the required fields.', badPhone: 'Enter a valid mobile number — digits only (11 digits).', failed: 'Could not place the order. Try again or order on WhatsApp.',
    send: 'Send', sending: 'Sending…', sent: 'Sent — thank you! We will reply soon.', message: 'Your message',
    newsletter: 'Newsletter', newsletterText: 'Subscribe to hear first about new releases and exclusive offers.', subscribe: 'Subscribe', subscribed: 'Subscribed ✓', yourEmail: 'Your email',
    aboutShort: 'NESYAN — a scent that stays in memory. Inspired scents with high concentration, long-lasting wear and strong projection, plus Nesyan’s own editions.',
    followUs: 'Follow us', customerCare: 'Customer care', information: 'Information', rights: 'All rights reserved',
    finderTitle: 'Find your signature scent', finderQ1: 'Who is it for?', finderQ2: 'Which season is it for?', finderQ3: 'You like it…', light: 'Light & close', medium: 'Moderate', strong: 'Strong & bold',
    forMe: 'Me', forHer: 'Her', forHim: 'Him', anyone: 'Anyone', yourMatches: 'Your matches', again: 'Start again',
    notFound: 'Page not found', backHome: 'Back home', wishlistEmpty: 'You have not added any perfume yet.',
    flip: 'See the box', bottle: 'Bottle', box: 'Box', both: 'Bottle & box', inYourCart: 'in your bag', items: 'items',
    whatsappMsg: 'Hello Nesyan, I would like to order:', backTop: 'Back to top', results2: 'Search results', typeToSearch: 'Type a perfume or a note like “oud” or “vanilla”',
    contactTitle: 'Contact us', contactText: 'A question about a scent or an order? Write to us and we will reply shortly.', hours: 'Opening hours', ourValues: 'What sets us apart',
  },
}

const LangCtx = createContext(null)
const read = () => { try { return localStorage.getItem('ns-lang') } catch { return null } }

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => (read() === 'en' ? 'en' : 'ar'))
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    try { localStorage.setItem('ns-lang', lang) } catch { /* private mode */ }
  }, [lang])
  const toggle = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), [])
  const value = useMemo(() => ({
    lang, toggle, u: T[lang], ar: lang === 'ar',
    // نص من كائن فيه field_ar / field_en — لو الإنجليزي فاضي بيرجع للعربي
    tx: (o, f) => (o ? (o[`${f}_${lang}`] || o[`${f}_ar`] || o[`${f}_en`] || '') : ''),
    t2: (pair) => (Array.isArray(pair) ? pair[lang === 'ar' ? 0 : 1] : pair),
  }), [lang, toggle])
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}
export const useLang = () => useContext(LangCtx)
