import { prisma } from '../index.js';
import { logger } from '../../utils/logger.js';

/**
 * Seed email templates for authentication.
 * Spec Appendix A.19: EmailTemplate model.
 */
export async function seedEmailTemplates(): Promise<void> {
  logger.info('Seeding email templates...');

  // Email Verification Template
  await prisma.emailTemplate.upsert({
    where: { templateKey: 'email_verification' },
    create: {
      templateKey: 'email_verification',
      name: 'Email Verification',
      description: 'Email sent to new users to verify their email address. Includes 24-hour expiry verification link.',
      subject: {
        en: 'Verify your email address',
        ar: 'تحقق من عنوان بريدك الإلكتروني',
        'zh-CN': '验证您的电子邮件地址',
        'zh-TW': '驗證您的電子郵件地址',
        vi: 'Xác minh địa chỉ email của bạn',
        hi: 'अपना ईमेल पता सत्यापित करें',
        ur: 'اپنے ای میل ایڈریس کی تصدیق کریں',
        ko: '이메일 주소 확인',
        el: 'Επαλήθευση διεύθυνσης email',
        it: 'Verifica il tuo indirizzo email',
      },
      bodyHtml: {
        en: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Welcome, {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Thank you for joining our community. To complete your registration, please verify your email address by clicking the button below.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            This link will expire in {{expiryHours}} hours.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            If you didn't create an account, please ignore this email.
          </p>
        `,
        ar: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            مرحباً {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            شكراً لانضمامك إلى مجتمعنا. لإكمال تسجيلك، يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الزر أدناه.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  تأكيد البريد الإلكتروني
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            ستنتهي صلاحية هذا الرابط في غضون {{expiryHours}} ساعة.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.
          </p>
        `,
        'zh-CN': `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            欢迎，{{userName}}！
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            感谢您加入我们的社区。请点击下面的按钮验证您的电子邮件地址以完成注册。
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  验证电子邮件地址
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            此链接将在 {{expiryHours}} 小时后过期。
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            如果您没有创建帐户，请忽略此电子邮件。
          </p>
        `,
        'zh-TW': `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            歡迎，{{userName}}！
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            感謝您加入我們的社區。請點擊下面的按鈕驗證您的電子郵件地址以完成註冊。
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  驗證電子郵件地址
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            此連結將在 {{expiryHours}} 小時後過期。
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            如果您沒有創建帳戶，請忽略此電子郵件。
          </p>
        `,
        vi: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Chào mừng, {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Cảm ơn bạn đã tham gia cộng đồng của chúng tôi. Để hoàn tất đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách nhấp vào nút bên dưới.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Xác minh địa chỉ email
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Liên kết này sẽ hết hạn sau {{expiryHours}} giờ.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.
          </p>
        `,
        hi: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            स्वागत है, {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            हमारे समुदाय में शामिल होने के लिए धन्यवाद। अपना पंजीकरण पूरा करने के लिए, कृपया नीचे दिए गए बटन पर क्लिक करके अपने ईमेल पते की पुष्टि करें।
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  ईमेल पता सत्यापित करें
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            यह लिंक {{expiryHours}} घंटे में समाप्त हो जाएगा।
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            यदि आपने खाता नहीं बनाया है, तो कृपया इस ईमेल को अनदेखा करें।
          </p>
        `,
        ur: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            خوش آمدید، {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            ہماری کمیونٹی میں شامل ہونے کا شکریہ۔ اپنی رجسٹریشن مکمل کرنے کے لیے، براہ کرم نیچے دیے گئے بٹن پر کلک کرکے اپنے ای میل ایڈریس کی تصدیق کریں۔
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  ای میل ایڈریس کی تصدیق کریں
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            یہ لنک {{expiryHours}} گھنٹوں میں ختم ہو جائے گا۔
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            اگر آپ نے اکاؤنٹ نہیں بنایا، تو براہ کرم اس ای میل کو نظر انداز کریں۔
          </p>
        `,
        ko: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            환영합니다, {{userName}}님!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            커뮤니티에 참여해 주셔서 감사합니다. 등록을 완료하려면 아래 버튼을 클릭하여 이메일 주소를 확인하세요.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  이메일 주소 확인
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            이 링크는 {{expiryHours}}시간 후에 만료됩니다.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            계정을 만들지 않으셨다면 이 이메일을 무시하세요.
          </p>
        `,
        el: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Καλώς ήρθατε, {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Ευχαριστούμε που εγγραφήκατε στην κοινότητά μας. Για να ολοκληρώσετε την εγγραφή σας, επαληθεύστε τη διεύθυνση email σας κάνοντας κλικ στο παρακάτω κουμπί.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Επαλήθευση διεύθυνσης email
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Αυτός ο σύνδεσμος θα λήξει σε {{expiryHours}} ώρες.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Αν δεν δημιουργήσατε λογαριασμό, παρακαλώ αγνοήστε αυτό το email.
          </p>
        `,
        it: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Benvenuto, {{userName}}!
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Grazie per esserti unito alla nostra comunità. Per completare la registrazione, verifica il tuo indirizzo email facendo clic sul pulsante qui sotto.
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #2C5F7C;">
                <a href="{{verificationLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Verifica indirizzo email
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Questo link scadrà tra {{expiryHours}} ore.
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Se non hai creato un account, ignora questa email.
          </p>
        `,
      },
      bodyText: {
        en: `Welcome, {{userName}}!

Thank you for joining our community. To complete your registration, please verify your email address by clicking the link below:

{{verificationLink}}

This link will expire in {{expiryHours}} hours.

If you didn't create an account, please ignore this email.`,
        ar: `مرحباً {{userName}}!

شكراً لانضمامك إلى مجتمعنا. لإكمال تسجيلك، يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الرابط أدناه:

{{verificationLink}}

ستنتهي صلاحية هذا الرابط في غضون {{expiryHours}} ساعة.

إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد الإلكتروني.`,
        'zh-CN': `欢迎，{{userName}}！

感谢您加入我们的社区。请点击下面的链接验证您的电子邮件地址以完成注册：

{{verificationLink}}

此链接将在 {{expiryHours}} 小时后过期。

如果您没有创建帐户，请忽略此电子邮件。`,
        'zh-TW': `歡迎，{{userName}}！

感謝您加入我們的社區。請點擊下面的連結驗證您的電子郵件地址以完成註冊：

{{verificationLink}}

此連結將在 {{expiryHours}} 小時後過期。

如果您沒有創建帳戶，請忽略此電子郵件。`,
        vi: `Chào mừng, {{userName}}!

Cảm ơn bạn đã tham gia cộng đồng của chúng tôi. Để hoàn tất đăng ký, vui lòng xác minh địa chỉ email của bạn bằng cách nhấp vào liên kết bên dưới:

{{verificationLink}}

Liên kết này sẽ hết hạn sau {{expiryHours}} giờ.

Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.`,
        hi: `स्वागत है, {{userName}}!

हमारे समुदाय में शामिल होने के लिए धन्यवाद। अपना पंजीकरण पूरा करने के लिए, कृपया नीचे दिए गए लिंक पर क्लिक करके अपने ईमेल पते की पुष्टि करें:

{{verificationLink}}

यह लिंक {{expiryHours}} घंटे में समाप्त हो जाएगा।

यदि आपने खाता नहीं बनाया है, तो कृपया इस ईमेल को अनदेखा करें।`,
        ur: `خوش آمدید، {{userName}}!

ہماری کمیونٹی میں شامل ہونے کا شکریہ۔ اپنی رجسٹریشن مکمل کرنے کے لیے، براہ کرم نیچے دیے گئے لنک پر کلک کرکے اپنے ای میل ایڈریس کی تصدیق کریں:

{{verificationLink}}

یہ لنک {{expiryHours}} گھنٹوں میں ختم ہو جائے گا۔

اگر آپ نے اکاؤنٹ نہیں بنایا، تو براہ کرم اس ای میل کو نظر انداز کریں۔`,
        ko: `환영합니다, {{userName}}님!

커뮤니티에 참여해 주셔서 감사합니다. 등록을 완료하려면 아래 링크를 클릭하여 이메일 주소를 확인하세요:

{{verificationLink}}

이 링크는 {{expiryHours}}시간 후에 만료됩니다.

계정을 만들지 않으셨다면 이 이메일을 무시하세요.`,
        el: `Καλώς ήρθατε, {{userName}}!

Ευχαριστούμε που εγγραφήκατε στην κοινότητά μας. Για να ολοκληρώσετε την εγγραφή σας, επαληθεύστε τη διεύθυνση email σας κάνοντας κλικ στον παρακάτω σύνδεσμο:

{{verificationLink}}

Αυτός ο σύνδεσμος θα λήξει σε {{expiryHours}} ώρες.

Αν δεν δημιουργήσατε λογαριασμό, παρακαλώ αγνοήστε αυτό το email.`,
        it: `Benvenuto, {{userName}}!

Grazie per esserti unito alla nostra comunità. Per completare la registrazione, verifica il tuo indirizzo email facendo clic sul link qui sotto:

{{verificationLink}}

Questo link scadrà tra {{expiryHours}} ore.

Se non hai creato un account, ignora questa email.`,
      },
      variables: ['userName', 'verificationLink', 'expiryHours'],
      active: true,
    },
    update: {},
  });

  // Password Reset Template
  await prisma.emailTemplate.upsert({
    where: { templateKey: 'password_reset' },
    create: {
      templateKey: 'password_reset',
      name: 'Password Reset',
      description: 'Email sent when user requests password reset. Includes 1-hour expiry reset link and security info.',
      subject: {
        en: 'Reset your password',
        ar: 'إعادة تعيين كلمة المرور',
        'zh-CN': '重置您的密码',
        'zh-TW': '重設您的密碼',
        vi: 'Đặt lại mật khẩu',
        hi: 'अपना पासवर्ड रीसेट करें',
        ur: 'اپنا پاس ورڈ دوبارہ ترتیب دیں',
        ko: '비밀번호 재설정',
        el: 'Επαναφορά κωδικού πρόσβασης',
        it: 'Reimposta la tua password',
      },
      bodyHtml: {
        en: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Password Reset Request
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Hi {{userName}},
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            This link will expire in {{expiryMinutes}} minutes.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              Security Information
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              Request from IP: {{ipAddress}}<br>
              Time: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            If you didn't request a password reset, please ignore this email and contact support immediately.
          </p>
        `,
        ar: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            طلب إعادة تعيين كلمة المرور
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            مرحباً {{userName}}،
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  إعادة تعيين كلمة المرور
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            ستنتهي صلاحية هذا الرابط في غضون {{expiryMinutes}} دقيقة.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              معلومات الأمان
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              الطلب من IP: {{ipAddress}}<br>
              الوقت: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني والاتصال بالدعم على الفور.
          </p>
        `,
        'zh-CN': `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            密码重置请求
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            您好 {{userName}}，
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            我们收到了重置您密码的请求。点击下面的按钮创建新密码：
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  重置密码
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            此链接将在 {{expiryMinutes}} 分钟后过期。
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              安全信息
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              请求来自 IP: {{ipAddress}}<br>
              时间: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            如果您没有请求重置密码，请忽略此电子邮件并立即联系支持人员。
          </p>
        `,
        'zh-TW': `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            密碼重設請求
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            您好 {{userName}}，
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            我們收到了重設您密碼的請求。點擊下面的按鈕創建新密碼：
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  重設密碼
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            此連結將在 {{expiryMinutes}} 分鐘後過期。
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              安全信息
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              請求來自 IP: {{ipAddress}}<br>
              時間: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            如果您沒有請求重設密碼，請忽略此電子郵件並立即聯繫支援人員。
          </p>
        `,
        vi: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Yêu cầu đặt lại mật khẩu
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Xin chào {{userName}},
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấp vào nút bên dưới để tạo mật khẩu mới:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Đặt lại mật khẩu
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Liên kết này sẽ hết hạn sau {{expiryMinutes}} phút.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              Thông tin bảo mật
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              Yêu cầu từ IP: {{ipAddress}}<br>
              Thời gian: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ với bộ phận hỗ trợ ngay lập tức.
          </p>
        `,
        hi: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            पासवर्ड रीसेट अनुरोध
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            नमस्ते {{userName}},
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            हमें आपका पासवर्ड रीसेट करने का अनुरोध प्राप्त हुआ। नया पासवर्ड बनाने के लिए नीचे दिए गए बटन पर क्लिक करें:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  पासवर्ड रीसेट करें
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            यह लिंक {{expiryMinutes}} मिनट में समाप्त हो जाएगा।
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              सुरक्षा जानकारी
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              IP से अनुरोध: {{ipAddress}}<br>
              समय: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            यदि आपने पासवर्ड रीसेट का अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें और तुरंत समर्थन से संपर्क करें।
          </p>
        `,
        ur: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            پاس ورڈ ری سیٹ کی درخواست
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            سلام {{userName}}،
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            ہمیں آپ کا پاس ورڈ دوبارہ ترتیب دینے کی درخواست موصول ہوئی۔ نیا پاس ورڈ بنانے کے لیے نیچے دیے گئے بٹن پر کلک کریں:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  پاس ورڈ دوبارہ ترتیب دیں
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            یہ لنک {{expiryMinutes}} منٹ میں ختم ہو جائے گا۔
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              سیکیورٹی کی معلومات
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              IP سے درخواست: {{ipAddress}}<br>
              وقت: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            اگر آپ نے پاس ورڈ ری سیٹ کی درخواست نہیں کی، تو براہ کرم اس ای میل کو نظر انداز کریں اور فوری طور پر سپورٹ سے رابطہ کریں۔
          </p>
        `,
        ko: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            비밀번호 재설정 요청
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            안녕하세요 {{userName}}님,
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새 비밀번호를 생성하세요:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  비밀번호 재설정
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            이 링크는 {{expiryMinutes}}분 후에 만료됩니다.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              보안 정보
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              IP에서 요청: {{ipAddress}}<br>
              시간: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하고 즉시 지원팀에 문의하세요.
          </p>
        `,
        el: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Αίτημα επαναφοράς κωδικού πρόσβασης
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Γεια σας {{userName}},
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Λάβαμε αίτημα επαναφοράς του κωδικού πρόσβασής σας. Κάντε κλικ στο παρακάτω κουμπί για να δημιουργήσετε νέο κωδικό πρόσβασης:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Επαναφορά κωδικού πρόσβασης
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Αυτός ο σύνδεσμος θα λήξει σε {{expiryMinutes}} λεπτά.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              Πληροφορίες ασφαλείας
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              Αίτημα από IP: {{ipAddress}}<br>
              Ώρα: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            Αν δεν ζητήσατε επαναφορά κωδικού πρόσβασης, παρακαλώ αγνοήστε αυτό το email και επικοινωνήστε αμέσως με την υποστήριξη.
          </p>
        `,
        it: `
          <h2 style="margin: 0 0 16px; font-family: 'Montserrat', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #2C3E50;">
            Richiesta di reimpostazione password
          </h2>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Ciao {{userName}},
          </p>
          <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #2C3E50;">
            Abbiamo ricevuto una richiesta di reimpostazione della tua password. Fai clic sul pulsante qui sotto per creare una nuova password:
          </p>
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
            <tr>
              <td align="center" style="border-radius: 4px; background-color: #E67E22;">
                <a href="{{resetLink}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Montserrat', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Reimposta password
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: #7F8C8D;">
            Questo link scadrà tra {{expiryMinutes}} minuti.
          </p>
          <div style="margin: 24px 0; padding: 16px; background-color: #FFF3CD; border-left: 4px solid #F39C12; border-radius: 4px;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #856404;">
              Informazioni di sicurezza
            </p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404;">
              Richiesta da IP: {{ipAddress}}<br>
              Ora: {{timestamp}}
            </p>
          </div>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #E74C3C;">
            Se non hai richiesto la reimpostazione della password, ignora questa email e contatta immediatamente il supporto.
          </p>
        `,
      },
      bodyText: {
        en: `Password Reset Request

Hi {{userName}},

We received a request to reset your password. Click the link below to create a new password:

{{resetLink}}

This link will expire in {{expiryMinutes}} minutes.

Security Information:
- Request from IP: {{ipAddress}}
- Time: {{timestamp}}

If you didn't request a password reset, please ignore this email and contact support immediately.`,
        ar: `طلب إعادة تعيين كلمة المرور

مرحباً {{userName}}،

تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الرابط أدناه لإنشاء كلمة مرور جديدة:

{{resetLink}}

ستنتهي صلاحية هذا الرابط في غضون {{expiryMinutes}} دقيقة.

معلومات الأمان:
- الطلب من IP: {{ipAddress}}
- الوقت: {{timestamp}}

إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني والاتصال بالدعم على الفور.`,
        'zh-CN': `密码重置请求

您好 {{userName}}，

我们收到了重置您密码的请求。点击下面的链接创建新密码：

{{resetLink}}

此链接将在 {{expiryMinutes}} 分钟后过期。

安全信息：
- 请求来自 IP: {{ipAddress}}
- 时间: {{timestamp}}

如果您没有请求重置密码，请忽略此电子邮件并立即联系支持人员。`,
        'zh-TW': `密碼重設請求

您好 {{userName}}，

我們收到了重設您密碼的請求。點擊下面的連結創建新密碼：

{{resetLink}}

此連結將在 {{expiryMinutes}} 分鐘後過期。

安全信息：
- 請求來自 IP: {{ipAddress}}
- 時間: {{timestamp}}

如果您沒有請求重設密碼，請忽略此電子郵件並立即聯繫支援人員。`,
        vi: `Yêu cầu đặt lại mật khẩu

Xin chào {{userName}},

Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu của bạn. Nhấp vào liên kết bên dưới để tạo mật khẩu mới:

{{resetLink}}

Liên kết này sẽ hết hạn sau {{expiryMinutes}} phút.

Thông tin bảo mật:
- Yêu cầu từ IP: {{ipAddress}}
- Thời gian: {{timestamp}}

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này và liên hệ với bộ phận hỗ trợ ngay lập tức.`,
        hi: `पासवर्ड रीसेट अनुरोध

नमस्ते {{userName}},

हमें आपका पासवर्ड रीसेट करने का अनुरोध प्राप्त हुआ। नया पासवर्ड बनाने के लिए नीचे दिए गए लिंक पर क्लिक करें:

{{resetLink}}

यह लिंक {{expiryMinutes}} मिनट में समाप्त हो जाएगा।

सुरक्षा जानकारी:
- IP से अनुरोध: {{ipAddress}}
- समय: {{timestamp}}

यदि आपने पासवर्ड रीसेट का अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें और तुरंत समर्थन से संपर्क करें।`,
        ur: `پاس ورڈ ری سیٹ کی درخواست

سلام {{userName}}،

ہمیں آپ کا پاس ورڈ دوبارہ ترتیب دینے کی درخواست موصول ہوئی۔ نیا پاس ورڈ بنانے کے لیے نیچے دیے گئے لنک پر کلک کریں:

{{resetLink}}

یہ لنک {{expiryMinutes}} منٹ میں ختم ہو جائے گا۔

سیکیورٹی کی معلومات:
- IP سے درخواست: {{ipAddress}}
- وقت: {{timestamp}}

اگر آپ نے پاس ورڈ ری سیٹ کی درخواست نہیں کی، تو براہ کرم اس ای میل کو نظر انداز کریں اور فوری طور پر سپورٹ سے رابطہ کریں۔`,
        ko: `비밀번호 재설정 요청

안녕하세요 {{userName}}님,

비밀번호 재설정 요청을 받았습니다. 아래 링크를 클릭하여 새 비밀번호를 생성하세요:

{{resetLink}}

이 링크는 {{expiryMinutes}}분 후에 만료됩니다.

보안 정보:
- IP에서 요청: {{ipAddress}}
- 시간: {{timestamp}}

비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하고 즉시 지원팀에 문의하세요.`,
        el: `Αίτημα επαναφοράς κωδικού πρόσβασης

Γεια σας {{userName}},

Λάβαμε αίτημα επαναφοράς του κωδικού πρόσβασής σας. Κάντε κλικ στον παρακάτω σύνδεσμο για να δημιουργήσετε νέο κωδικό πρόσβασης:

{{resetLink}}

Αυτός ο σύνδεσμος θα λήξει σε {{expiryMinutes}} λεπτά.

Πληροφορίες ασφαλείας:
- Αίτημα από IP: {{ipAddress}}
- Ώρα: {{timestamp}}

Αν δεν ζητήσατε επαναφορά κωδικού πρόσβασης, παρακαλώ αγνοήστε αυτό το email και επικοινωνήστε αμέσως με την υποστήριξη.`,
        it: `Richiesta di reimpostazione password

Ciao {{userName}},

Abbiamo ricevuto una richiesta di reimpostazione della tua password. Fai clic sul link qui sotto per creare una nuova password:

{{resetLink}}

Questo link scadrà tra {{expiryMinutes}} minuti.

Informazioni di sicurezza:
- Richiesta da IP: {{ipAddress}}
- Ora: {{timestamp}}

Se non hai richiesto la reimpostazione della password, ignora questa email e contatta immediatamente il supporto.`,
      },
      variables: ['userName', 'resetLink', 'expiryMinutes', 'ipAddress', 'timestamp'],
      active: true,
    },
    update: {},
  });

  logger.info('Email templates seeded successfully');
}
