

export type Language = 'en' | 'th' | 'mm';

export const translations = {
  en: {
    // Sidebar
    sales: "Sales",
    inventory: "Inventory",
    customers: "Customers",
    report: "Report",
    archive: "Archive",
    settings: "Settings",
    dashboard: "Dashboard",
    // Login
    username: "Username",
    password: "Password",
    login: "Start Shift",
    rememberMe: "Remember credentials",
    systemName: "The Green Spot",
    secureTerminal: "Secure POS Terminal",
    accessDenied: "Access Denied: Invalid credentials.",
    authenticating: "AUTHENTICATING...",
    // Sales Form
    newSale: "New Sale",
    productStrain: "Product / Strain",
    quantity: "Quantity",
    confirmSale: "Confirm Sale",
    paymentMethod: "Payment Method",
    totalPrice: "Total Price",
    cash: "Cash",
    scan: "Scan",
    searchPlaceholder: "Search Product...",
    selectItem: "Select Item",
    manualAdjustment: "Manual Adjustment",
    revertAuto: "Revert to Auto",
    // Inventory
    inventoryManagement: "Inventory Management",
    addProduct: "Add Product",
    orderList: "Order List",
    productName: "Product Name",
    currentStock: "Current Stock",
    category: "Category",
    grade: "Grade",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    editProduct: "Edit Product",
    addNewProduct: "Add New Product",
    stock: "Stock",
    // Settings
    language: "Language",
    cloudStatus: "Cloud Status",
    connected: "Connected",
    offline: "Offline",
    migrateData: "Upload Local Data",
    loadDefault: "Load Default Inventory",
    userGuide: "User Guide",
    helpCenter: "Help Center",
    // Common
    logout: "Log Out",
    dailyTotal: "Daily Total",
    today: "Today's Transactions",
    recentTransactions: "Recent Transactions",
    
    // User Guide Content
    guide: {
        title: "User Guide",
        subtitle: "v3.1 Manual",
        tabs: {
            sales: "Sales Terminal",
            inventory: "Inventory Mgmt",
            reports: "Daily Reports",
            general: "General & Cloud"
        },
        sales: {
            title: "Processing a Sale",
            desc: "The Sales Terminal is designed for speed. Search, adjust quantities, and process payments efficiently.",
            steps: [
                { t: "Find a Product", d: "Use the search bar to find a strain by name, or click the category tabs (Flower, Pre-roll, etc.) to browse." },
                { t: "Select & Adjust", d: "Click a product to select it. For flowers, choose the Grade (Mid, Top, etc.) and use the + / - buttons to set grams." },
                { t: "Check Pricing", d: "The system calculates price automatically based on weight tiers. Toggle 'Manual Adjustment' to override." },
                { t: "Add to Order", d: "Click 'Add to Order' to move the item to the cart on the right. Repeat for multiple items." },
                { t: "Checkout", d: "Review the cart. Select Payment Method (Cash or Scan). Click 'Complete Transaction' to finish." }
            ]
        },
        inventory: {
            title: "Managing Stock",
            desc: "Keep track of your products. Items with 0 stock will automatically alert you.",
            steps: [
                { t: "Adding New Items", d: "Click the '+' button. Enter Name, Category, Grade (for flower), and initial Stock level." },
                { t: "Updating Stock", d: "Use the small Up/Down arrows next to the stock number in the list to make quick adjustments." },
                { t: "Low Stock Alerts", d: "Items with low stock appear in amber. Out of stock items appear in red. Use 'Order List' to view shortages." },
                { t: "Deleting Items", d: "Admins can delete items using the Trash icon. Be careful, this cannot be undone." }
            ]
        },
        reports: {
            title: "End of Shift",
            desc: "Track daily revenue, expenses, and close out your shift correctly.",
            steps: [
                { t: "Review Transactions", d: "The left side shows a live receipt of all today's sales. You can delete a sale here if a mistake was made." },
                { t: "Record Expenses", d: "Bought ice? Paid for lunch? Enter description and amount on the right side to track shop expenses." },
                { t: "Save & Archive", d: "Click 'Save Day' to upload the report to the Cloud Archive. This saves the history permanently." },
                { t: "Close Shift", d: "Click 'Close Shift' (Reset) to clear the screen for the next day. Make sure you saved first!" }
            ]
        },
        general: {
            title: "System Features",
            desc: "Data syncing, themes, and troubleshooting.",
            features: [
                { t: "Cloud Sync", d: "The app automatically saves every sale to Google Cloud. If you lose internet, it works offline and syncs later." },
                { t: "Archive", d: "Go to the Archive tab to view past sales. You can 'Restore' a report if you accidentally closed a shift too early." },
                { t: "Multiple Devices", d: "You can log in on multiple tablets or phones. Sales update in real-time across all devices." }
            ]
        }
    }
  },
  th: {
    sales: "การขาย",
    inventory: "คลังสินค้า",
    customers: "ลูกค้า",
    report: "รายงาน",
    archive: "ประวัติ",
    settings: "ตั้งค่า",
    dashboard: "แดชบอร์ด",
    username: "ชื่อผู้ใช้",
    password: "รหัสผ่าน",
    login: "เริ่มกะงาน",
    rememberMe: "จำรหัสผ่าน",
    systemName: "เดอะ กรีน สปอต",
    secureTerminal: "ระบบจุดขายปลอดภัย",
    accessDenied: "เข้าสู่ระบบล้มเหลว: ข้อมูลไม่ถูกต้อง",
    authenticating: "กำลังตรวจสอบ...",
    newSale: "รายการขายใหม่",
    productStrain: "สินค้า / สายพันธุ์",
    quantity: "จำนวน",
    confirmSale: "ยืนยันการขาย",
    paymentMethod: "วิธีการชำระเงิน",
    totalPrice: "ราคารวม",
    cash: "เงินสด",
    scan: "สแกนจ่าย",
    searchPlaceholder: "ค้นหาสินค้า...",
    selectItem: "เลือกสินค้า",
    manualAdjustment: "ปรับราคาเอง",
    revertAuto: "ใช้ราคาอัตโนมัติ",
    inventoryManagement: "จัดการคลังสินค้า",
    addProduct: "เพิ่มสินค้า",
    orderList: "รายการสั่งซื้อ",
    productName: "ชื่อสินค้า",
    currentStock: "คงเหลือ",
    category: "หมวดหมู่",
    grade: "เกรด",
    actions: "จัดการ",
    save: "บันทึก",
    cancel: "ยกเลิก",
    editProduct: "แก้ไขสินค้า",
    addNewProduct: "เพิ่มสินค้าใหม่",
    stock: "สต็อก",
    language: "ภาษา",
    cloudStatus: "สถานะระบบคลาวด์",
    connected: "เชื่อมต่อแล้ว",
    offline: "ออฟไลน์",
    migrateData: "อัปโหลดข้อมูล",
    loadDefault: "โหลดข้อมูลตัวอย่าง",
    userGuide: "คู่มือการใช้งาน",
    helpCenter: "ช่วยเหลือ",
    logout: "ออกจากระบบ",
    dailyTotal: "ยอดขายวันนี้",
    today: "รายการขายวันนี้",
    recentTransactions: "รายการล่าสุด",
    
    // User Guide TH
    guide: {
        title: "คู่มือการใช้งาน",
        subtitle: "เวอร์ชัน 3.1",
        tabs: {
            sales: "จุดขาย (Sales)",
            inventory: "คลังสินค้า",
            reports: "รายงานประจำวัน",
            general: "ทั่วไป & Cloud"
        },
        sales: {
            title: "การขายสินค้า",
            desc: "ระบบขายออกแบบมาเพื่อความรวดเร็ว ค้นหาสินค้า ปรับจำนวน และรับชำระเงินได้ทันที",
            steps: [
                { t: "หาสินค้า", d: "ใช้ช่องค้นหาเพื่อหาชื่อสายพันธุ์ หรือกดที่หมวดหมู่เพื่อเลือกดูสินค้า" },
                { t: "เลือกและปรับ", d: "คลิกที่สินค้า สำหรับดอกไม้ ให้เลือกเกรดและใช้ปุ่ม +/- เพื่อระบุน้ำหนัก" },
                { t: "ตรวจสอบราคา", d: "ระบบคำนวณราคาอัตโนมัติตามน้ำหนัก หากต้องการลดราคาให้เปิด 'ปรับราคาเอง'" },
                { t: "เพิ่มในรายการ", d: "กด 'เพิ่มในรายการ' สินค้าจะไปอยู่ที่ตะกร้าด้านขวา ทำซ้ำได้หลายรายการ" },
                { t: "ชำระเงิน", d: "ตรวจสอบตะกร้า เลือกวิธีชำระ (เงินสด/สแกน) แล้วกด 'ยืนยันการขาย'" }
            ]
        },
        inventory: {
            title: "การจัดการสต็อก",
            desc: "ติดตามสินค้าของคุณ ระบบจะแจ้งเตือนเมื่อสินค้าหมด",
            steps: [
                { t: "เพิ่มสินค้าใหม่", d: "กดปุ่ม '+' มุมขวาบน ใส่ชื่อ หมวดหมู่ เกรด และจำนวนสต็อกเริ่มต้น" },
                { t: "อัปเดตสต็อก", d: "ใช้ลูกศรขึ้น/ลง ข้างตัวเลขสต็อกเพื่อปรับจำนวนอย่างรวดเร็ว" },
                { t: "แจ้งเตือนสต็อกต่ำ", d: "สินค้าใกล้หมดจะเป็นสีเหลือง สินค้าหมดเป็นสีแดง กดปุ่ม 'รายการสั่งซื้อ' เพื่อดูสิ่งที่ต้องเติม" },
                { t: "ลบสินค้า", d: "แอดมินสามารถลบสินค้าได้โดยใช้ไอคอนถังขยะ (กู้คืนไม่ได้)" }
            ]
        },
        reports: {
            title: "จบกะงาน",
            desc: "ติดตามยอดขาย ค่าใช้จ่าย และปิดกะอย่างถูกต้อง",
            steps: [
                { t: "ตรวจสอบรายการ", d: "ด้านซ้ายแสดงใบเสร็จสดของวันนี้ สามารถลบรายการผิดได้ที่นี่" },
                { t: "บันทึกค่าใช้จ่าย", d: "ซื้อน้ำแข็ง? ค่าข้าว? ใส่รายละเอียดและจำนวนเงินด้านขวาเพื่อบันทึกรายจ่ายร้าน" },
                { t: "บันทึกและจัดเก็บ", d: "กด 'บันทึก' เพื่ออัปโหลดรายงานเข้า Cloud เพื่อเก็บประวัติถาวร" },
                { t: "ปิดกะ", d: "กด 'ปิดกะ' (รีเซ็ต) เพื่อล้างหน้าจอสำหรับวันถัดไป อย่าลืมบันทึกก่อน!" }
            ]
        },
        general: {
            title: "ฟีเจอร์ระบบ",
            desc: "การซิงค์ข้อมูล ธีม และการแก้ปัญหา",
            features: [
                { t: "Cloud Sync", d: "แอปบันทึกข้อมูลลง Google Cloud อัตโนมัติ หากเน็ตหลุดจะทำงานออฟไลน์และซิงค์ทีหลัง" },
                { t: "ประวัติ (Archive)", d: "ไปที่แท็บประวัติเพื่อดูยอดขายย้อนหลัง กู้คืนรายงานได้หากปิดกะผิดพลาด" },
                { t: "หลายอุปกรณ์", d: "ล็อกอินพร้อมกันได้หลายเครื่อง ยอดขายจะอัปเดตทันทีทุกเครื่อง" }
            ]
        }
    }
  },
  mm: {
    sales: "အရောင်း",
    inventory: "ကုန်ပစ္စည်း",
    customers: "ဖောက်သည်များ",
    report: "မှတ်တမ်း",
    archive: "သိမ်းဆည်း",
    settings: "ဆက်တင်များ",
    dashboard: "ဒိုင်ခွက်",
    username: "အသုံးပြုသူအမည်",
    password: "စကားဝှက်",
    login: "အလုပ်စတင်ပါ",
    rememberMe: "မှတ်မိပါစေ",
    systemName: "The Green Spot",
    secureTerminal: "လုံခြုံသော အရောင်းစနစ်",
    accessDenied: "ဝင်ရောက်မှု မအောင်မြင်ပါ",
    authenticating: "စစ်ဆေးနေသည်...",
    newSale: "အရောင်းသစ်",
    productStrain: "ကုန်ပစ္စည်း / အမျိုးအစား",
    quantity: "အရေအတွက်",
    confirmSale: "အတည်ပြုပါ",
    paymentMethod: "ငွေပေးချေမှုပုံစံ",
    totalPrice: "စုစုပေါင်းစျေးနှုန်း",
    cash: "ငွေသား",
    scan: "စကင်န်",
    searchPlaceholder: "ရှာဖွေပါ...",
    selectItem: "ရွေးချယ်ပါ",
    manualAdjustment: "စျေးနှုန်းပြင်ရန်",
    revertAuto: "အလိုအလျောက်",
    inventoryManagement: "ကုန်ပစ္စည်းစီမံခန့်ခွဲမှု",
    addProduct: "ကုန်ပစ္စည်းထည့်ပါ",
    orderList: "မှာယူရမည့်စာရင်း",
    productName: "ကုန်ပစ္စည်းအမည်",
    currentStock: "လက်ကျန်",
    category: "အမျိုးအစား",
    grade: "အဆင့်",
    actions: "လုပ်ဆောင်ချက်များ",
    save: "သိမ်းဆည်း",
    cancel: "မလုပ်တော့ပါ",
    editProduct: "ပြင်ဆင်ရန်",
    addNewProduct: "အသစ်ထည့်ရန်",
    stock: "လက်ကျန်",
    language: "ဘာသာစကား",
    cloudStatus: "Cloud အခြေအနေ",
    connected: "ချိတ်ဆက်ထားသည်",
    offline: "အော့ဖ်လိုင်း",
    migrateData: "ဒေတာတင်ပို့ရန်",
    loadDefault: "နမူနာဒေတာထည့်ရန်",
    userGuide: "အသုံးပြုနည်းလမ်းညွှန်",
    helpCenter: "အကူအညီ",
    logout: "ထွက်ရန်",
    dailyTotal: "ယနေ့ရောင်းရငွေ",
    today: "ယနေ့ အရောင်းစာရင်း",
    recentTransactions: "လတ်တလော အရောင်းများ",
    
    // User Guide MM
    guide: {
        title: "အသုံးပြုနည်းလမ်းညွှန်",
        subtitle: "v3.1 လက်စွဲ",
        tabs: {
            sales: "အရောင်းစနစ်",
            inventory: "ကုန်ပစ္စည်းစီမံခန့်ခွဲမှု",
            reports: "နေ့စဉ်မှတ်တမ်း",
            general: "အထွေထွေ & Cloud"
        },
        sales: {
            title: "အရောင်းပြုလုပ်ခြင်း",
            desc: "အရောင်းစနစ်သည် လျင်မြန်မှုအတွက် ဒီဇိုင်းထုတ်ထားသည်။ ကုန်ပစ္စည်းရှာဖွေခြင်းနှင့် ငွေပေးချေမှုများကို လျင်မြန်စွာလုပ်ဆောင်နိုင်သည်။",
            steps: [
                { t: "ကုန်ပစ္စည်းရှာရန်", d: "ကုန်ပစ္စည်းအမည်ဖြင့်ရှာရန် ရှာဖွေရေးဘားကိုသုံးပါ သို့မဟုတ် အမျိုးအစားများကိုနှိပ်၍ရှာပါ။" },
                { t: "ရွေးချယ်ပြီးချိန်ညှိပါ", d: "ကုန်ပစ္စည်းကိုနှိပ်ပါ။ ပန်းပွင့်များအတွက် အဆင့် (Grade) ရွေးပြီး ဂရမ်သတ်မှတ်ရန် +/- ခလုတ်များကိုသုံးပါ။" },
                { t: "စျေးနှုန်းစစ်ဆေးပါ", d: "စနစ်သည် အလေးချိန်ပေါ်မူတည်၍ စျေးနှုန်းကို အလိုအလျောက်တွက်ချက်ပေးသည်။ လျှော့စျေးပေးလိုပါက 'စျေးနှုန်းပြင်ရန်' ကိုဖွင့်ပါ။" },
                { t: "အော်ဒါထဲထည့်ပါ", d: "'Add to Order' ကိုနှိပ်ပါ။ ကုန်ပစ္စည်းသည် ညာဘက်ရှိ ခြင်းတောင်းထဲသို့ ရောက်သွားပါမည်။" },
                { t: "ငွေချေပါ", d: "ခြင်းတောင်းကိုစစ်ဆေးပါ။ ငွေပေးချေမှုပုံစံ (ငွေသား/စကင်န်) ရွေးချယ်ပြီး 'အတည်ပြုပါ' ကိုနှိပ်ပါ။" }
            ]
        },
        inventory: {
            title: "စတော့ခ်ထိန်းသိမ်းခြင်း",
            desc: "ကုန်ပစ္စည်းများကို မျက်ခြေမပြတ်ကြည့်ရှုပါ။ လက်ကျန် 0 ဖြစ်သွားသော ပစ္စည်းများကို စနစ်က သတိပေးပါလိမ့်မည်။",
            steps: [
                { t: "ပစ္စည်းအသစ်ထည့်ရန်", d: "ညာဘက်အပေါ်ထောင့်ရှိ '+' ခလုတ်ကိုနှိပ်ပါ။ အမည်၊ အမျိုးအစား၊ အဆင့်နှင့် လက်ကျန်အရေအတွက်ကို ထည့်ပါ။" },
                { t: "စတော့ခ်ပြင်ဆင်ရန်", d: "စာရင်းရှိ စတော့ခ်နံပါတ်ဘေးရှိ အပေါ်/အောက် မြှားလေးများကိုသုံး၍ လျင်မြန်စွာ ပြင်ဆင်နိုင်သည်။" },
                { t: "လက်ကျန်နည်း သတိပေးချက်", d: "လက်ကျန်နည်းသောပစ္စည်းများသည် အဝါရောင်၊ ကုန်သွားသောပစ္စည်းများသည် အနီရောင်ပြပါမည်။" },
                { t: "ပစ္စည်းဖျက်ရန်", d: "Admin များသည် အမှိုက်ပုံးပုံစံကိုနှိပ်၍ ပစ္စည်းများကို ဖျက်နိုင်သည်။ (ပြန်ယူ၍မရပါ)" }
            ]
        },
        reports: {
            title: "အလုပ်ချိန်သိမ်းခြင်း",
            desc: "နေ့စဉ် ဝင်ငွေ၊ ထွက်ငွေများကို မှတ်တမ်းတင်ပြီး အလုပ်ချိန်ကို စနစ်တကျပိတ်ပါ။",
            steps: [
                { t: "အရောင်းများကိုစစ်ဆေးပါ", d: "ဘယ်ဘက်တွင် ယနေ့အရောင်းပြေစာများကို ပြသထားသည်။ မှားယွင်းမှုရှိပါက ဤနေရာတွင် ဖျက်နိုင်သည်။" },
                { t: "စရိတ်များမှတ်တမ်းတင်ပါ", d: "ရေခဲဝယ်ခဲ့သလား? နေ့လည်စာစားခဲ့သလား? ဆိုင်စရိတ်များကို ညာဘက်တွင် မှတ်တမ်းတင်ပါ။" },
                { t: "သိမ်းဆည်းပါ", d: "'သိမ်းဆည်း' ကိုနှိပ်၍ Cloud Archive သို့ ပို့ပါ။ ၎င်းသည် မှတ်တမ်းများကို ထာဝရသိမ်းဆည်းထားပါမည်။" },
                { t: "အလုပ်ချိန်ပိတ်ပါ", d: "နောက်တစ်နေ့အတွက် ရှင်းလင်းရန် 'Close Shift' (Reset) ကိုနှိပ်ပါ။ မနှိပ်မီ သိမ်းဆည်းရန် မမေ့ပါနှင့်!" }
            ]
        },
        general: {
            title: "စနစ်အင်္ဂါရပ်များ",
            desc: "ဒေတာချိတ်ဆက်ခြင်း၊ ဒီဇိုင်းပုံစံများနှင့် ပြဿနာဖြေရှင်းခြင်း။",
            features: [
                { t: "Cloud Sync", d: "အရောင်းတိုင်းကို Google Cloud သို့ အလိုအလျောက်သိမ်းဆည်းသည်။ အင်တာနက်မရှိပါက အော့ဖ်လိုင်းအလုပ်လုပ်ပြီး နောက်မှ ပြန်လည်ချိတ်ဆက်ပါမည်။" },
                { t: "Archive", d: "ပြီးခဲ့သောအရောင်းများကိုကြည့်ရန် Archive tab သို့သွားပါ။ အလုပ်ချိန်စောပိတ်မိပါက 'Restore' လုပ်နိုင်သည်။" },
                { t: "စက်အများအပြား", d: "ဖုန်း သို့မဟုတ် တက်ဘလက်အများအပြားတွင် ဝင်ရောက်နိုင်သည်။ အရောင်းများသည် စက်အားလုံးတွင် တပြိုင်နက် အပ်ဒိတ်ဖြစ်ပါမည်။" }
            ]
        }
    }
  }
};
