export interface ToolFaq {
  question: string;
  answer: string;
}

export interface Tool {
  slug: string;
  title: string;
  shortDescription: string;
  category: 'calc' | 'datetime' | 'text' | 'daily' | 'image' | 'pdf' | 'table';
  icon: string;
  badge?: string;
  howTo?: string[];
  formula?: string;
  faq?: ToolFaq[];
}

export interface Category {
  id: 'calc' | 'datetime' | 'text' | 'daily' | 'image' | 'pdf' | 'table';
  title: string;
  description: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'image',
    title: 'تصویر و گرافیک',
    description: 'فشرده‌سازی، تغییر سایز، برش عکس پروفایل و تبدیل فرمت‌ها',
    icon: 'ImageIcon',
  },
  {
    id: 'table',
    title: 'جدول و داده',
    description: 'جدول‌ساز آنلاین، تبدیل جدول وب به اکسل، نمایشگر CSV و مارک‌داون',
    icon: 'Table',
  },
  {
    id: 'calc',
    title: 'محاسبات و مالی',
    description: 'وام، طلا، عیدی و سنوات، سود سپرده، مالیات حقوق و درصد',
    icon: 'Calculator',
  },
  {
    id: 'datetime',
    title: 'زمان و تاریخ',
    description: 'تبدیل تقویم، محاسبه سن، فاصله تاریخ‌ها و سن بارداری',
    icon: 'Calendar',
  },
  {
    id: 'text',
    title: 'متن و نگارش',
    description: 'ویراستار فارسی، حذف تکراری‌ها، مرتب‌سازی و تبدیل فینگلیش',
    icon: 'Type',
  },
  {
    id: 'pdf',
    title: 'اسناد و PDF',
    description: 'ادغام صفحات PDF و تبدیل تصاویر به یک فایل PDF در مرورگر',
    icon: 'FileCode2',
  },
  {
    id: 'daily',
    title: 'کاربردی و روزمره',
    description: 'تولید بارکد، لینک واتساپ، BMI، کالری، قرعه‌کشی و رمز عبور',
    icon: 'Wrench',
  },
];

export const TOOLS: Tool[] = [
  // --- ۱. ابزارهای تصویر و گرافیک ---
  {
    slug: 'image-compressor',
    title: 'فشرده‌ساز آنلاین عکس',
    shortDescription: 'کاهش حجم تصاویر JPG و PNG بدون افت کیفیت و با پردازش سریع مرورگر',
    category: 'image',
    icon: 'Minimize2',
    badge: 'پربازدید',
  },
  {
    slug: 'image-resizer',
    title: 'تغییر سایز و ابعاد عکس',
    shortDescription: 'تغییر اندازه پیکسلی یا درصدی تصاویر با حفظ تناسب و وضوح',
    category: 'image',
    icon: 'Scaling',
  },
  {
    slug: 'circle-avatar',
    title: 'برش دایره‌ای عکس پروفایل',
    shortDescription: 'ساخت عکس گرد برای آواتار اینستاگرام، تلگرام و رزومه با پس‌زمینه شفاف',
    category: 'image',
    icon: 'Crop',
    badge: 'محبوب',
  },
  {
    slug: 'image-converter',
    title: 'تبدیل فرمت عکس',
    shortDescription: 'تبدیل فرمت تصاویر بین JPG، PNG و WebP بدون آپلود به سرور',
    category: 'image',
    icon: 'RefreshCw',
  },
  {
    slug: 'image-blur',
    title: 'مات‌کردن و سانسور عکس',
    shortDescription: 'شطرنجی و محو کردن بخش‌های حساس اسکرین‌شات‌ها و عکس‌ها',
    category: 'image',
    icon: 'EyeOff',
  },

  // --- ۲. محاسبات و امور مالی ---
  {
    slug: 'loan-calculator',
    title: 'محاسبه اقساط و سود وام',
    shortDescription: 'محاسبه مبلغ قسط ماهانه، کل سود و کل بازپرداخت وام‌های بانکی',
    category: 'calc',
    icon: 'CreditCard',
    badge: 'کاربردی',
  },
  {
    slug: 'gold-calculator',
    title: 'محاسبه قیمت طلا و حباب سکه',
    shortDescription: 'تفکیک اجرت، سود و مالیات قانونی فاکتور طلا و تعیین حباب انواع سکه',
    category: 'calc',
    icon: 'Coins',
  },
  {
    slug: 'number-to-words',
    title: 'تبدیل عدد به حروف فارسی',
    shortDescription: 'تبدیل مبالغ عددی به حروف فارسی (تومان و ریال) برای چک، سفته و قراردادها',
    category: 'calc',
    icon: 'Hash',
    badge: 'ویژه',
  },
  {
    slug: 'bank-deposit-interest',
    title: 'محاسبه سود سپرده بانکی',
    shortDescription: 'محاسبه سود ماهانه و سالانه سپرده‌های کوتاه‌مدت و بلندمدت بانکی',
    category: 'calc',
    icon: 'PiggyBank',
  },
  {
    slug: 'severance-calculator',
    title: 'محاسبه عیدی، پاداش و سنوات',
    shortDescription: 'محاسبه رسمی عیدی و سنوات کارگری طبق آخرین مصوبات قانون کار',
    category: 'calc',
    icon: 'Briefcase',
    badge: 'قانون کار',
  },
  {
    slug: 'salary-tax-calculator',
    title: 'محاسبه مالیات حقوق',
    shortDescription: 'محاسبه پله‌های معافیت و کسورات مالیات بر درآمد حقوق‌بگیران',
    category: 'calc',
    icon: 'Receipt',
  },
  {
    slug: 'percentage-calculator',
    title: 'محاسبه درصد و تخفیف',
    shortDescription: 'محاسبه سریع درصد سود، تخفیف فاکتور و افزایش/کاهش قیمت',
    category: 'calc',
    icon: 'Percent',
  },

  // --- ۳. زمان و تاریخ ---
  {
    slug: 'age-calculator',
    title: 'محاسبه سن دقیق',
    shortDescription: 'محاسبه سن بر حسب سال، ماه، روز و زمان مانده تا تولد بعدی',
    category: 'datetime',
    icon: 'Clock',
    badge: 'پربازدید',
  },
  {
    slug: 'date-converter',
    title: 'تبدیل تاریخ سه‌گانه',
    shortDescription: 'تبدیل تاریخ‌های شمسی و میلادی با نمایش روز هفته و سال کبیسه',
    category: 'datetime',
    icon: 'CalendarRange',
  },
  {
    slug: 'date-diff',
    title: 'محاسبه اختلاف دو تاریخ شمسی',
    shortDescription: 'محاسبه فاصله زمانی دقیق بین دو تاریخ به روز، هفته و تفکیک روزهای کاری',
    category: 'datetime',
    icon: 'Hourglass',
  },
  {
    slug: 'pregnancy-calculator',
    title: 'محاسبه سن بارداری و زایمان',
    shortDescription: 'تعیین هفته‌های بارداری و زمان تقریبی زایمان بر اساس تقویم شمسی',
    category: 'datetime',
    icon: 'Baby',
    badge: 'سلامت',
  },

  // --- ۴. متن و نگارش ---
  {
    slug: 'persian-editor',
    title: 'ویراستار و اصلاح نیم‌فاصله',
    shortDescription: 'اصلاح خودکار نیم‌فاصله‌ها، «ي» و «ك» عربی و علائم نگارشی فارسی',
    category: 'text',
    icon: 'SpellCheck',
    badge: 'ویژه',
  },
  {
    slug: 'word-counter',
    title: 'شمارنده کلمات و حروف متن',
    shortDescription: 'شمارش تعداد کلمات مقاله، حروف با فاصله و تخمین زمان مطالعه',
    category: 'text',
    icon: 'FileText',
  },
  {
    slug: 'remove-duplicate-lines',
    title: 'حذف خطوط تکراری متن',
    shortDescription: 'پاک‌سازی موارد و ردیف‌های تکراری از لیست‌ها، ایمیل‌ها و شماره‌ها',
    category: 'text',
    icon: 'CopyCheck',
  },
  {
    slug: 'alphabetical-sort',
    title: 'مرتب‌سازی الفبایی متن',
    shortDescription: 'سورت کردن خطوط متن به ترتیب حروف الفبای فارسی و انگلیسی (A-Z و Z-A)',
    category: 'text',
    icon: 'ArrowDownAZ',
  },
  {
    slug: 'clean-text-lines',
    title: 'حذف فاصله‌ها و خطوط خالی',
    shortDescription: 'پاک‌سازی شکستگی‌های خطوط و فاصله‌های اضافه کپی‌شده از PDF و وب',
    category: 'text',
    icon: 'WrapText',
  },
  {
    slug: 'finglish-converter',
    title: 'تبدیل فینگلیش به فارسی',
    shortDescription: 'تبدیل هوشمند متون نوشته‌شده با حروف انگلیسی (Finglish) به خط فارسی',
    category: 'text',
    icon: 'Languages',
  },

  // --- ۵. اسناد و PDF ---
  {
    slug: 'pdf-merge',
    title: 'ادغام فایل‌های PDF',
    shortDescription: 'ترکیب و چسباندن چند فایل PDF به یک سند واحد به صورت آفلاین در مرورگر',
    category: 'pdf',
    icon: 'Files',
    badge: 'بدون سرور',
  },
  {
    slug: 'images-to-pdf',
    title: 'تبدیل عکس به PDF',
    shortDescription: 'تبدیل یک یا چند تصویر JPG و PNG به یک فایل PDF منسجم برای چاپ و ارسال',
    category: 'pdf',
    icon: 'FileSpreadsheet',
  },

  // --- ۶. کاربردی و روزمره ---
  {
    slug: 'qr-generator',
    title: 'ساخت بارکد QR آنلاین',
    shortDescription: 'تولید رایگان QR Code برای لینک، وای‌فای، شماره تماس و متن دلخواه',
    category: 'daily',
    icon: 'QrCode',
    badge: 'محبوب',
  },
  {
    slug: 'barcode-generator',
    title: 'تولید بارکد میله‌ای (Barcode)',
    shortDescription: 'ساخت بارکدهای استاندارد فروشگاهی Code 128 و EAN-13 با امکان دانلود SVG',
    category: 'daily',
    icon: 'Barcode',
  },
  {
    slug: 'whatsapp-link-generator',
    title: 'ساخت لینک چت مستقیم واتساپ',
    shortDescription: 'ایجاد لینک شروع گفتگو در واتساپ بدون نیاز به ذخیره شماره در مخاطبین',
    category: 'daily',
    icon: 'MessageCircle',
  },
  {
    slug: 'social-counter',
    title: 'شمارنده بیو و کپشن شبکه‌های اجتماعی',
    shortDescription: 'بررسی محدودیت طول کاراکتر بیو و کپشن اینستاگرام، توییتر و تلگرام',
    category: 'daily',
    icon: 'Share2',
  },
  {
    slug: 'bmi-calculator',
    title: 'محاسبه شاخص توده بدنی (BMI)',
    shortDescription: 'بررسی وضعیت تناسب اندام، کمبود یا اضافه وزن و وزن ایده‌آل',
    category: 'daily',
    icon: 'Activity',
  },
  {
    slug: 'calorie-calculator',
    title: 'محاسبه کالری روزانه (BMR / TDEE)',
    shortDescription: 'محاسبه کالری مصرفی بر اساس وزن، قد و میزان تحرک برای لاغری یا تثبیت',
    category: 'daily',
    icon: 'Flame',
  },
  {
    slug: 'password-generator',
    title: 'ساخت رمز عبور قوی آنلاین',
    shortDescription: 'تولید کلمه عبور غیرقابل حدس و مطمئن برای اینستاگرام، ایمیل و اکانت‌ها',
    category: 'daily',
    icon: 'KeyRound',
  },
  {
    slug: 'national-code',
    title: 'بررسی صحت کد ملی و کارت بانکی',
    shortDescription: 'اعتبارسنجی الگوریتمی کد ملی، تشخیص شهر و بررسی کارت شتاب با فرمول Luhn',
    category: 'daily',
    icon: 'ShieldCheck',
  },
  {
    slug: 'random-picker',
    title: 'قرعه‌کشی و انتخاب تصادفی',
    shortDescription: 'انتخاب رندوم برنده از بین لیست اسامی، شماره‌ها و شرکت‌کنندگان مسابقه',
    category: 'daily',
    icon: 'Shuffle',
  },
  {
    slug: 'coin-dice',
    title: 'شیر یا خط و پرتاب تاس آنلاین',
    shortDescription: 'ابزار شبیه‌ساز پرتاب سکه و تاس تصادفی برای بازی و تصمیم‌گیری سریع',
    category: 'daily',
    icon: 'Dices',
  },

  // --- ۷. ابزارهای جدول و داده ---
  {
    slug: 'table-builder',
    title: 'جدول‌ساز آنلاین و بصری',
    shortDescription: 'ساخت و ویرایش آسان جدول بدون نیاز به اکسل با خروجی کپی برای Word و CSV',
    category: 'table',
    icon: 'Table',
    badge: 'کاربردی',
  },
  {
    slug: 'html-table-to-excel',
    title: 'تبدیل جدول وب به اکسل',
    shortDescription: 'استخراج جداول کپی‌شده از سایت‌ها و تبدیل مستقیم به فایل اکسل و CSV',
    category: 'table',
    icon: 'FileSpreadsheet',
  },
  {
    slug: 'csv-viewer',
    title: 'نمایشگر و اصلاح فایل CSV',
    shortDescription: 'باز کردن فایل‌های CSV، اصلاح به‌هم‌ریختگی حروف فارسی UTF-8 و خروجی تمیز اکسل',
    category: 'table',
    icon: 'Sheet',
    badge: 'حل مشکل فونت',
  },
  {
    slug: 'markdown-table',
    title: 'جدول‌ساز مارک‌داون (Markdown)',
    shortDescription: 'طراحی بصری جدول و تولید خودکار کد Markdown برای وردپرس، گیت‌هاب و نوت‌ها',
    category: 'table',
    icon: 'Code2',
  },
  {
    slug: 'text-table',
    title: 'تبدیل جدول به متن تمیز (ASCII)',
    shortDescription: 'ساخت جداول متنی خط‌کشی‌شده با کاراکترهای منظم برای ارسال در تلگرام و واتساپ',
    category: 'table',
    icon: 'AlignJustify',
  },

  // --- ۸. ابزارهای تکمیلی و پرمخاطب وب فارسی ---
  {
    slug: 'unit-converter',
    title: 'مبدل جامع واحدها',
    shortDescription: 'تبدیل واحدهای وزن (مثقال، گرم، اونس)، طول (اینچ، متر)، دما، مساحت و حجم',
    category: 'calc',
    icon: 'ArrowLeftRight',
    badge: 'جامع',
  },
  {
    slug: 'toman-rial-converter',
    title: 'تبدیل تومان به ریال و برعکس',
    shortDescription: 'تبدیل آسان مبالغ بین تومان و ریال با حذف/افزودن صفر و نمایش حروف برای چک و فاکتور',
    category: 'calc',
    icon: 'Coins',
    badge: 'پربازدید',
  },
  {
    slug: 'gharzolhasaneh-loan',
    title: 'محاسبه وام قرض‌الحسنه ۴٪',
    shortDescription: 'محاسبه اقساط و کارمزد سالانه وام‌های قرض‌الحسنه بانک مهر ایران و رسالت',
    category: 'calc',
    icon: 'Percent',
  },
  {
    slug: 'timer-stopwatch',
    title: 'تایمر، کرونومتر و پومودورو',
    shortDescription: 'زمان‌سنج دقیق، شمارش معکوس و زمان‌بندی تکنیک پومودورو برای مطالعه و کار',
    category: 'datetime',
    icon: 'Timer',
    badge: 'تمرکز',
  },
  {
    slug: 'world-clock',
    title: 'ساعت جهانی و اختلاف زمان',
    shortDescription: 'مشاهده ساعت رسمی و اختلاف زمانی تهران با استانبول، دبی، تورنتو، لندن و فرانکفورت',
    category: 'datetime',
    icon: 'Globe2',
  },
  {
    slug: 'lorem-generator',
    title: 'تولیدکننده لورم ایپسوم فارسی',
    shortDescription: 'تولید متن ساختگی و آزمایشی فارسی و انگلیسی برای طراحان وب و گرافیست‌ها',
    category: 'text',
    icon: 'FileText',
  },
  {
    slug: 'case-converter',
    title: 'تغییر حروف انگلیسی (Case)',
    shortDescription: 'تبدیل سریع حروف متن به حروف بزرگ (UPPERCASE)، کوچک (lowercase) و Title Case',
    category: 'text',
    icon: 'CaseSensitive',
  },
  {
    slug: 'water-intake',
    title: 'محاسبه آب مصرفی روزانه بدن',
    shortDescription: 'محاسبه لیتر و لیوان آب مورد نیاز روزانه بر اساس وزن، قد و میزان فعالیت ورزشی',
    category: 'daily',
    icon: 'Droplets',
    badge: 'سلامت',
  },
  {
    slug: 'blood-type',
    title: 'سازگاری گروه‌های خونی',
    shortDescription: 'بررسی علمی سازگاری اهدا و دریافت خون و فاکتور Rh بین تمامی گروه‌ها',
    category: 'daily',
    icon: 'HeartPulse',
  },
  {
    slug: 'random-number',
    title: 'تولید عدد تصادفی آنلاین',
    shortDescription: 'تولید سریع اعداد رندوم در بازه دلخواه بدون تکرار برای قرعه‌کشی و بازی',
    category: 'daily',
    icon: 'Binary',
  },
  {
    slug: 'color-picker-image',
    title: 'استخراج رنگ و پالت از عکس',
    shortDescription: 'قطره‌چکان آنلاین و شناسایی کدهای رنگی HEX و RGB از هر نقطه تصویر',
    category: 'image',
    icon: 'Pipette',
  },
];
