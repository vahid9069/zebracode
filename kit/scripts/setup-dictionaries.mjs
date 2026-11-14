import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// English translation mapping for tools
const enTranslations = {
  'image-compressor': {
    title: 'Online Image Compressor',
    shortDescription: 'Compress JPG, PNG, and WebP images locally with high quality and zero server uploads.',
    badge: 'Popular',
  },
  'image-resizer': {
    title: 'Image Resizer',
    shortDescription: 'Resize images by pixels or percentage while maintaining aspect ratio and sharpness.',
  },
  'circle-avatar': {
    title: 'Circular Avatar Cropper',
    shortDescription: 'Crop profile photos into circles with transparent backgrounds for Instagram, Telegram, and resumes.',
    badge: 'Popular',
  },
  'image-converter': {
    title: 'Image Format Converter',
    shortDescription: 'Convert images between JPG, PNG, WebP, AVIF, and ICO locally in your browser.',
  },
  'image-blur': {
    title: 'Blur & Pixelate Image',
    shortDescription: 'Censor sensitive information or blur faces in photos and screenshots privately.',
  },
  'loan-calculator': {
    title: 'Loan Payment Calculator',
    shortDescription: 'Calculate monthly loan installments, total interest, and total repayment schedule.',
    badge: 'Utility',
  },
  'gold-calculator': {
    title: 'Gold Price Calculator',
    shortDescription: 'Calculate gold jewelry manufacturing fees, profit margin, and coin price premiums.',
  },
  'number-to-words': {
    title: 'Number to Words Converter',
    shortDescription: 'Convert numbers and currency amounts into written words for invoices and checks.',
    badge: 'Featured',
  },
  'bank-deposit-interest': {
    title: 'Bank Deposit Interest Calculator',
    shortDescription: 'Calculate monthly and annual returns on short-term and long-term savings deposits.',
  },
  'severance-calculator': {
    title: 'Severance & Bonus Calculator',
    shortDescription: 'Calculate legal end-of-service benefits, bonuses, and severance pay based on labor laws.',
  },
  'salary-tax-calculator': {
    title: 'Salary Tax Calculator',
    shortDescription: 'Calculate employee monthly income tax deductions according to legal tax brackets.',
  },
  'percentage-calculator': {
    title: 'Percentage Calculator',
    shortDescription: 'Quickly calculate percentage increase, discount rates, and portion of a whole.',
  },
  'age-calculator': {
    title: 'Exact Age Calculator',
    shortDescription: 'Calculate your exact age in years, months, days, hours, and find out your next birthday countdown.',
    badge: 'Popular',
  },
  'date-converter': {
    title: 'Calendar & Date Converter',
    shortDescription: 'Convert dates between Gregorian, Solar Hijri (Jalali), and Islamic Lunar calendars.',
  },
  'date-diff': {
    title: 'Date Difference Calculator',
    shortDescription: 'Calculate exact days, weeks, and months between two calendar dates.',
  },
  'pregnancy-calculator': {
    title: 'Pregnancy Due Date Calculator',
    shortDescription: 'Calculate estimated due date, gestational age, and fetal development milestones.',
  },
  'persian-editor': {
    title: 'Persian Text Editor & Cleaner',
    shortDescription: 'Clean up Persian typography, normalize half-spaces (ZWNJ), and fix Arabic characters.',
  },
  'word-counter': {
    title: 'Word & Character Counter',
    shortDescription: 'Count words, characters, sentences, paragraphs, and estimate reading time.',
  },
  'remove-duplicate-lines': {
    title: 'Remove Duplicate Lines',
    shortDescription: 'Filter out duplicate lines, sort text alphabetically, and clean lists instantly.',
  },
  'alphabetical-sort': {
    title: 'Alphabetical Text Sorter',
    shortDescription: 'Sort text lines alphabetically (A-Z or Z-A) with numeric and case-sensitive options.',
  },
  'clean-text-lines': {
    title: 'Text Line Cleaner',
    shortDescription: 'Remove empty lines, trim leading/trailing whitespace, and join paragraphs cleanly.',
  },
  'finglish-converter': {
    title: 'Finglish to Persian Converter',
    shortDescription: 'Convert Latin Finglish (Pinglish) writing into proper Persian script.',
  },
  'pdf-merge': {
    title: 'Merge PDF Files',
    shortDescription: 'Combine multiple PDF documents into one single file with drag-and-drop page sorting.',
    badge: 'Popular',
  },
  'images-to-pdf': {
    title: 'Images to PDF Converter',
    shortDescription: 'Convert multiple JPG and PNG images into a clean, unified PDF document.',
  },
  'qr-generator': {
    title: 'QR Code Generator',
    shortDescription: 'Create custom QR codes for URLs, WiFi passwords, vCards, text, and WhatsApp with colors.',
    badge: 'Featured',
  },
  'barcode-generator': {
    title: 'Barcode Generator',
    shortDescription: 'Generate standard Code128, EAN-13, UPC, and Code39 barcodes for products and labels.',
  },
  'whatsapp-link-generator': {
    title: 'WhatsApp Direct Chat Link',
    shortDescription: 'Create instant WhatsApp chat links with pre-filled messages without saving contacts.',
  },
  'social-counter': {
    title: 'Social Media Character Counter',
    shortDescription: 'Check character limits for X (Twitter), Instagram captions, LinkedIn, and SMS.',
  },
  'bmi-calculator': {
    title: 'BMI Body Mass Index Calculator',
    shortDescription: 'Calculate Body Mass Index (BMI), ideal weight range, and nutritional status categories.',
  },
  'calorie-calculator': {
    title: 'Daily Calorie & BMR Calculator',
    shortDescription: 'Calculate Basal Metabolic Rate (BMR) and daily calorie intake for weight loss or gain.',
  },
  'password-generator': {
    title: 'Secure Password Generator',
    shortDescription: 'Generate strong, uncrackable random passwords with symbols, numbers, and custom length.',
    badge: 'Security',
  },
  'national-code': {
    title: 'National ID Validator & Generator',
    shortDescription: 'Validate and check checksum algorithms for Iranian National ID numbers.',
  },
  'random-picker': {
    title: 'Random Item Picker & Raffle',
    shortDescription: 'Pick a random winner from a list of names, items, or raffle entries fairly.',
  },
  'coin-dice': {
    title: 'Coin Flipper & Dice Roller',
    shortDescription: 'Flip virtual coins (Heads or Tails) and roll 6-sided dice with sound and physics.',
  },
  'table-builder': {
    title: 'Online Table Generator',
    shortDescription: 'Create, design, and export interactive data tables with custom rows, columns, and styles.',
  },
  'html-table-to-excel': {
    title: 'HTML Table to Excel Converter',
    shortDescription: 'Extract tables from web HTML and convert them into downloadable Excel (.xlsx) spreadsheets.',
  },
  'csv-viewer': {
    title: 'CSV File Viewer & Editor',
    shortDescription: 'Open, inspect, filter, search, and edit CSV spreadsheet files locally in your browser.',
  },
  'markdown-table': {
    title: 'Markdown Table Generator',
    shortDescription: 'Build, align, and copy clean Markdown tables for GitHub, README files, and documentation.',
  },
  'text-table': {
    title: 'Plain Text Table Generator',
    shortDescription: 'Generate ASCII plain text tables with borders for terminal output, emails, and notes.',
  },
  'unit-converter': {
    title: 'Comprehensive Unit Converter',
    shortDescription: 'Convert length, weight, temperature, area, volume, and data storage units instantly.',
  },
  'toman-rial-converter': {
    title: 'Toman to Rial Converter',
    shortDescription: 'Quickly convert between Iranian Toman and Rial currency amounts with digit formatting.',
  },
  'gharzolhasaneh-loan': {
    title: 'Gharzolhasaneh Interest-Free Loan Calculator',
    shortDescription: 'Calculate annual 4% administrative fee installments for interest-free loans.',
  },
  'timer-stopwatch': {
    title: 'Online Stopwatch & Interval Timer',
    shortDescription: 'Digital stopwatch with lap times, countdown timer, and audible alert sounds.',
  },
  'world-clock': {
    title: 'World Clock & Time Zone Converter',
    shortDescription: 'Compare live times across global cities, UTC, Tehran, London, New York, and Tokyo.',
  },
  'lorem-generator': {
    title: 'Lorem Ipsum Dummy Text Generator',
    shortDescription: 'Generate placeholder text in Persian and English by paragraphs, words, or sentences.',
  },
  'case-converter': {
    title: 'Text Case Converter',
    shortDescription: 'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, and camelCase.',
  },
  'water-intake': {
    title: 'Daily Water Intake Calculator',
    shortDescription: 'Calculate recommended daily water intake based on body weight and activity levels.',
  },
  'blood-type': {
    title: 'Blood Type Compatibility Checker',
    shortDescription: 'Check blood type compatibility for blood donations, transfusions, and inheritance.',
  },
  'random-number': {
    title: 'Random Number Generator',
    shortDescription: 'Generate cryptographically random numbers within a custom minimum and maximum range.',
  },
  'color-picker-image': {
    title: 'Image Color Picker & Eyedropper',
    shortDescription: 'Extract HEX and RGB color codes from any uploaded photo using an interactive eyedropper.',
  },
};

// Read tools.ts to get Persian data
const toolsTsContent = fs.readFileSync(path.join(__dirname, '../src/lib/tools.ts'), 'utf8');

// Parse TOOLS array
const regex = /{\s*slug:\s*'([^']+)',\s*title:\s*'([^']+)',\s*shortDescription:\s*'([^']+)'(?:,\s*category:\s*'([^']+)')?(?:,\s*icon:\s*'([^']+)')?(?:,\s*badge:\s*'([^']+)')?/g;

const faTools = {};
const enTools = {};

let match;
while ((match = regex.exec(toolsTsContent)) !== null) {
  const [, slug, title, shortDescription, , , badge] = match;
  faTools[slug] = {
    title,
    shortDescription,
    ...(badge ? { badge } : {}),
  };

  const en = enTranslations[slug] || {
    title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    shortDescription: shortDescription,
  };

  enTools[slug] = {
    title: en.title,
    shortDescription: en.shortDescription,
    ...(en.badge ? { badge: en.badge } : {}),
  };
}

fs.writeFileSync(path.join(__dirname, '../src/dictionaries/fa/tools.json'), JSON.stringify(faTools, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, '../src/dictionaries/en/tools.json'), JSON.stringify(enTools, null, 2), 'utf8');

console.log(`Generated dictionaries for ${Object.keys(faTools).length} tools in fa and en.`);
