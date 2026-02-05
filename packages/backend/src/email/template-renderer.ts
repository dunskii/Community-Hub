import { promises as fs } from 'node:fs';
import path from 'node:path';

import { loadPlatformConfig } from '../config/platform-loader.js';
import { prisma } from '../db/index.js';
import { logger } from '../utils/logger.js';
import type { EmailTemplateKey, LanguageCode, TemplateVariables } from './template-types.js';

interface RenderResult {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  language: LanguageCode;
}

/**
 * Email template renderer with multilingual support.
 * Spec Section 8: Multilingual support (10 languages).
 */
export class TemplateRenderer {
  /**
   * Render an email template with variables.
   *
   * Language selection:
   * 1. User's language preference (if provided)
   * 2. Platform default language (from platform.json)
   *
   * @param templateKey - Template identifier (e.g., 'email_verification')
   * @param variables - Variables to substitute
   * @param userLanguage - User's preferred language (optional)
   */
  async render<K extends EmailTemplateKey>(
    templateKey: K,
    variables: TemplateVariables[K],
    userLanguage?: LanguageCode
  ): Promise<RenderResult> {
    // Load template from database
    const template = await prisma.emailTemplate.findUnique({
      where: { templateKey, active: true },
    });

    if (!template) {
      throw new Error(`Email template not found or inactive: ${templateKey}`);
    }

    // Select language
    const platformConfig = loadPlatformConfig();
    const language = userLanguage ?? (platformConfig.multilingual.defaultLanguage as LanguageCode);

    // Extract multilingual content
    const subjectJson = template.subject as Record<string, string>;
    const bodyHtmlJson = template.bodyHtml as Record<string, string>;
    const bodyTextJson = template.bodyText as Record<string, string>;

    const subject = subjectJson[language] ?? subjectJson['en'];
    let bodyHtml = bodyHtmlJson[language] ?? bodyHtmlJson['en'];
    let bodyText = bodyTextJson[language] ?? bodyTextJson['en'];

    if (!subject || !bodyHtml || !bodyText) {
      logger.error('Missing template content for language', { templateKey, language });
      throw new Error(`Template content missing for language: ${language}`);
    }

    // Substitute variables
    bodyHtml = this.substituteVariables(bodyHtml, variables);
    bodyText = this.substituteVariables(bodyText, variables);
    const renderedSubject = this.substituteVariables(subject, variables);

    // Wrap HTML in base template
    bodyHtml = await this.wrapInBaseTemplate(bodyHtml, language);

    return {
      subject: renderedSubject,
      bodyHtml,
      bodyText,
      language,
    };
  }

  /**
   * Substitute variables in template string.
   * Variables use {{variableName}} syntax.
   */
  private substituteVariables(template: string, variables: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, String(value));
    }
    return result;
  }

  /**
   * Wrap email content in base HTML template.
   * Base template includes header, footer, branding from platform.json.
   */
  private async wrapInBaseTemplate(content: string, language: LanguageCode): Promise<string> {
    const platformConfig = loadPlatformConfig();
    const isRtl = ['ar', 'ur'].includes(language);

    // Load base template from file system
    const baseTemplate = await this.loadBaseTemplate();

    return baseTemplate
      .replace('{{dir}}', isRtl ? 'rtl' : 'ltr')
      .replace('{{lang}}', language)
      .replace('{{platformName}}', platformConfig.branding.platformName)
      .replace('{{primaryColor}}', platformConfig.branding.colors.primary)
      .replace('{{secondaryColor}}', platformConfig.branding.colors.secondary)
      .replace('{{content}}', content)
      .replace('{{copyrightHolder}}', platformConfig.branding.copyrightHolder)
      .replace('{{supportEmail}}', platformConfig.contact.supportEmail);
  }

  /**
   * Load base HTML template from file system.
   */
  private async loadBaseTemplate(): Promise<string> {
    const templatePath = path.resolve(process.cwd(), 'src/email/templates/base.html');
    return fs.readFile(templatePath, 'utf-8');
  }
}
