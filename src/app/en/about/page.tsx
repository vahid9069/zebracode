import AboutView from '@/components/pages/AboutView';
import { getDictionary } from '@/i18n/getDictionary';

export const metadata = {
    title: 'About Us - ZebraCode',
};

export default async function EnAboutPage() {
    // خواندن دیکشنری در زمان Build
    const dict = await getDictionary('en');
    
    // ارسال دیتای ترجمه‌شده به کامپوننت مشترک
    return <AboutView dict={dict.about} />;
}