import { robotsConfig } from '../src/config/seo.js';

function generateRobotsTxt() {
  const { policies, sitemap } = robotsConfig;

  let content = '';

  policies.forEach(policy => {
    content += `User-agent: ${policy.userAgent}\n`;
    
    if (policy.allow) {
      const allows = Array.isArray(policy.allow) ? policy.allow : [policy.allow];
      allows.forEach(path => {
        content += `Allow: ${path}\n`;
      });
    }
    
    if (policy.disallow) {
      const disallows = Array.isArray(policy.disallow) ? policy.disallow : [policy.disallow];
      disallows.forEach(path => {
        content += `Disallow: ${path}\n`;
      });
    }
    
    content += '\n';
  });

  content += `Sitemap: ${sitemap}\n`;

  return content;
}

console.log(generateRobotsTxt());
