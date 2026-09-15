import AboutView from '@/components/pages/AboutView';
import { getDictionary } from '@/i18n/getDictionary';

export const metadata = {
    title: 'درباره ما - زبرا کد',
};

export default async function FaAboutPage() {
    // خواندن دیکشنری در زمان Build
    const dict = await getDictionary('fa');
    
    // ارسال دیتای ترجمه‌شده به کامپوننت مشترک
    return <AboutView dict={dict.about} />;
}