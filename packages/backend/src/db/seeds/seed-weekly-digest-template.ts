import { prisma } from '../index.js';
import { logger } from '../../utils/logger.js';

/**
 * Seed the weekly_digest email template.
 * Uses {{dealsHtml}} and {{eventsHtml}} for pre-rendered content sections.
 */
export async function seedWeeklyDigestTemplate(): Promise<void> {
  logger.info('Seeding weekly digest email template...');

  await prisma.email_templates.upsert({
    where: { template_key: 'weekly_digest' },
    create: {
      id: crypto.randomUUID(),
      template_key: 'weekly_digest',
      name: 'Weekly Digest',
      description: 'Weekly email with deals and events from saved businesses.',
      subject: {
        en: 'Your Weekly Update from {{platformName}}',
        ar: 'تحديثك الأسبوعي من {{platformName}}',
        'zh-CN': '来自 {{platformName}} 的每周更新',
        'zh-TW': '來自 {{platformName}} 的每週更新',
        vi: 'Cập nhật hàng tuần từ {{platformName}}',
        hi: '{{platformName}} से आपका साप्ताहिक अपडेट',
        ur: '{{platformName}} سے آپ کی ہفتہ وار اپ ڈیٹ',
        ko: '{{platformName}} 주간 업데이트',
        el: 'Η εβδομαδιαία ενημέρωσή σας από {{platformName}}',
        it: 'Il tuo aggiornamento settimanale da {{platformName}}',
      },
      body_html: {
        en: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Hi {{userName}}, here's what's happening this week!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            You're receiving this because you opted in to weekly updates.
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">Unsubscribe</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">Manage preferences</a>
          </p>
        `,
        ar: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            مرحباً {{userName}}، إليك ما يحدث هذا الأسبوع!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            تتلقى هذا لأنك اشتركت في التحديثات الأسبوعية.
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">إلغاء الاشتراك</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">إدارة التفضيلات</a>
          </p>
        `,
        'zh-CN': `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            您好 {{userName}}，这是本周的最新动态！
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            您收到此邮件是因为您订阅了每周更新。
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">取消订阅</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">管理偏好</a>
          </p>
        `,
        'zh-TW': `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            您好 {{userName}}，這是本週的最新動態！
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            您收到此郵件是因為您訂閱了每週更新。
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">取消訂閱</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">管理偏好</a>
          </p>
        `,
        vi: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Xin chào {{userName}}, đây là những gì đang diễn ra trong tuần này!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            Bạn nhận được email này vì bạn đã đăng ký nhận cập nhật hàng tuần.
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">Hủy đăng ký</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">Quản lý tùy chọn</a>
          </p>
        `,
        hi: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            नमस्ते {{userName}}, इस सप्ताह क्या हो रहा है!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            आपको यह ईमेल इसलिए मिल रहा है क्योंकि आपने साप्ताहिक अपडेट के लिए ऑप्ट-इन किया है।
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">सदस्यता रद्द करें</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">प्राथमिकताएं प्रबंधित करें</a>
          </p>
        `,
        ur: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            ہیلو {{userName}}، اس ہفتے کیا ہو رہا ہے!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            آپ کو یہ ای میل اس لیے مل رہی ہے کیونکہ آپ نے ہفتہ وار اپ ڈیٹس کے لیے آپٹ ان کیا ہے۔
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">ان سبسکرائب</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">ترجیحات کا انتظام</a>
          </p>
        `,
        ko: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            안녕하세요 {{userName}}님, 이번 주 소식입니다!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            주간 업데이트를 구독하셨기 때문에 이 이메일을 받으셨습니다.
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">구독 취소</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">환경설정 관리</a>
          </p>
        `,
        el: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Γεια σας {{userName}}, δείτε τι συμβαίνει αυτή την εβδομάδα!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            Λαμβάνετε αυτό το email επειδή εγγραφήκατε στις εβδομαδιαίες ενημερώσεις.
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">Απεγγραφή</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">Διαχείριση προτιμήσεων</a>
          </p>
        `,
        it: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Ciao {{userName}}, ecco cosa succede questa settimana!
          </h2>
          {{dealsHtml}}
          {{eventsHtml}}
          <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 24px 0;" />
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #7F8C8D;">
            Ricevi questa email perché ti sei iscritto agli aggiornamenti settimanali.
            <a href="{{unsubscribeUrl}}" style="color: #2C5F7C;">Annulla iscrizione</a> |
            <a href="{{preferencesUrl}}" style="color: #2C5F7C;">Gestisci preferenze</a>
          </p>
        `,
      },
      body_text: {
        en: 'Hi {{userName}}, here\'s what\'s happening this week!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nUnsubscribe: {{unsubscribeUrl}}\nManage preferences: {{preferencesUrl}}',
        ar: 'مرحباً {{userName}}، إليك ما يحدث هذا الأسبوع!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nإلغاء الاشتراك: {{unsubscribeUrl}}\nإدارة التفضيلات: {{preferencesUrl}}',
        'zh-CN': '您好 {{userName}}，这是本周的最新动态！\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\n取消订阅: {{unsubscribeUrl}}\n管理偏好: {{preferencesUrl}}',
        'zh-TW': '您好 {{userName}}，這是本週的最新動態！\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\n取消訂閱: {{unsubscribeUrl}}\n管理偏好: {{preferencesUrl}}',
        vi: 'Xin chào {{userName}}, đây là những gì đang diễn ra trong tuần này!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nHủy đăng ký: {{unsubscribeUrl}}\nQuản lý tùy chọn: {{preferencesUrl}}',
        hi: 'नमस्ते {{userName}}, इस सप्ताह क्या हो रहा है!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nसदस्यता रद्द करें: {{unsubscribeUrl}}\nप्राथमिकताएं प्रबंधित करें: {{preferencesUrl}}',
        ur: 'ہیلو {{userName}}، اس ہفتے کیا ہو رہا ہے!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nان سبسکرائب: {{unsubscribeUrl}}\nترجیحات کا انتظام: {{preferencesUrl}}',
        ko: '안녕하세요 {{userName}}님, 이번 주 소식입니다!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\n구독 취소: {{unsubscribeUrl}}\n환경설정 관리: {{preferencesUrl}}',
        el: 'Γεια σας {{userName}}, δείτε τι συμβαίνει αυτή την εβδομάδα!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nΑπεγγραφή: {{unsubscribeUrl}}\nΔιαχείριση προτιμήσεων: {{preferencesUrl}}',
        it: 'Ciao {{userName}}, ecco cosa succede questa settimana!\n\n{{dealsHtml}}\n\n{{eventsHtml}}\n\nAnnulla iscrizione: {{unsubscribeUrl}}\nGestisci preferenze: {{preferencesUrl}}',
      },
      variables: ['userName', 'platformName', 'dealsHtml', 'eventsHtml', 'hasDeals', 'hasEvents', 'unsubscribeUrl', 'preferencesUrl'],
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    update: {
      updated_at: new Date(),
    },
  });

  logger.info('Weekly digest email template seeded');
}
