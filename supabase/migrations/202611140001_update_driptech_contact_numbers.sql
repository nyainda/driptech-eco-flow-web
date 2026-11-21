-- Standardize the saved welcome-email template to the approved DripTech contacts.
-- Keep existing subscriber template customizations except the retired phone number.
UPDATE public.email_templates
SET
  html_content = replace(
    replace(html_content, '0114575401', '0723 407 849 / 0141294497'),
    '0111 409 454',
    '0723 407 849'
  ),
  text_content = replace(
    replace(text_content, '0114575401', '0723 407 849 / 0141294497'),
    '0111 409 454',
    '0723 407 849'
  ),
  updated_at = now()
WHERE html_content LIKE '%0114575401%'
   OR text_content LIKE '%0114575401%'
   OR html_content LIKE '%0111 409 454%'
   OR text_content LIKE '%0111 409 454%';
