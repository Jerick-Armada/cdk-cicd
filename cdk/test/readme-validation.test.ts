import * as fs from 'fs';
import * as path from 'path';

describe('README.md Validation', () => {
  const readmePath = path.join(__dirname, '../../readme.md');
  let readmeContent: string;

  beforeAll(() => {
    readmeContent = fs.readFileSync(readmePath, 'utf-8');
  });

  describe('File Structure', () => {
    it('should exist', () => {
      expect(fs.existsSync(readmePath)).toBe(true);
    });

    it('should not be empty', () => {
      expect(readmeContent.length).toBeGreaterThan(0);
    });

    it('should have substantial content', () => {
      expect(readmeContent.length).toBeGreaterThan(500);
    });
  });

  describe('Required Sections', () => {
    it('should have a title', () => {
      expect(readmeContent).toMatch(/^#\s+/m);
    });

    it('should have Prerequisites section', () => {
      expect(readmeContent.toLowerCase()).toContain('prerequisites');
    });

    it('should have AWS credentials configuration section', () => {
      expect(readmeContent.toLowerCase()).toMatch(/configure.*aws.*credentials|aws.*credentials.*configure/);
    });

    it('should have installation or setup instructions', () => {
      const hasInstall = readmeContent.toLowerCase().includes('install');
      const hasSetup = readmeContent.toLowerCase().includes('setup');
      expect(hasInstall || hasSetup).toBe(true);
    });

    it('should have deployment instructions', () => {
      expect(readmeContent.toLowerCase()).toContain('deploy');
    });

    it('should have testing instructions', () => {
      expect(readmeContent.toLowerCase()).toContain('test');
    });

    it('should have cleanup or teardown instructions', () => {
      const hasCleanup = readmeContent.toLowerCase().includes('cleanup');
      const hasDestroy = readmeContent.toLowerCase().includes('destroy');
      const hasTeardown = readmeContent.toLowerCase().includes('teardown');
      expect(hasCleanup || hasDestroy || hasTeardown).toBe(true);
    });
  });

  describe('Code Blocks', () => {
    it('should contain code blocks', () => {
      expect(readmeContent).toMatch(/```/);
    });

    it('should have properly closed code blocks', () => {
      const codeBlockMarkers = readmeContent.match(/```/g);
      expect(codeBlockMarkers).toBeTruthy();
      expect(codeBlockMarkers!.length % 2).toBe(0);
    });

    it('should include bash/shell commands', () => {
      const hasBashBlock = readmeContent.includes('```bash') || 
                          readmeContent.includes('```sh') ||
                          readmeContent.includes('```shell');
      expect(hasBashBlock).toBe(true);
    });

    it('should include CDK commands', () => {
      expect(readmeContent).toMatch(/cdk\s+(deploy|bootstrap|synth|destroy)/);
    });

    it('should include npm commands', () => {
      expect(readmeContent).toMatch(/npm\s+(install|ci|test)/);
    });
  });

  describe('AWS Specific Content', () => {
    it('should mention AWS CLI', () => {
      expect(readmeContent.toLowerCase()).toContain('aws cli');
    });

    it('should mention AWS profiles', () => {
      expect(readmeContent).toMatch(/--profile|aws configure --profile/);
    });

    it('should mention AWS CDK', () => {
      expect(readmeContent.toLowerCase()).toContain('cdk');
    });

    it('should mention bootstrapping', () => {
      expect(readmeContent.toLowerCase()).toContain('bootstrap');
    });

    it('should include aws configure command', () => {
      expect(readmeContent).toContain('aws configure');
    });

    it('should mention AWS regions', () => {
      expect(readmeContent).toMatch(/region|ap-southeast-2|us-east-1|eu-west-1/i);
    });

    it('should include account ID references', () => {
      expect(readmeContent).toMatch(/account.*id|aws.*account/i);
    });
  });

  describe('Authentication and Authorization Content', () => {
    it('should mention Cognito', () => {
      expect(readmeContent.toLowerCase()).toContain('cognito');
    });

    it('should mention User Pool', () => {
      expect(readmeContent.toLowerCase()).toMatch(/user pool/);
    });

    it('should mention signup/signin', () => {
      const hasSignup = readmeContent.toLowerCase().includes('signup') || 
                       readmeContent.toLowerCase().includes('sign up');
      const hasSignin = readmeContent.toLowerCase().includes('signin') || 
                       readmeContent.toLowerCase().includes('sign in');
      expect(hasSignup || hasSignin).toBe(true);
    });
  });

  describe('API Testing Examples', () => {
    it('should include API endpoint references', () => {
      expect(readmeContent).toMatch(/endpoint|api.*url/i);
    });

    it('should include example API calls', () => {
      const hasCurl = readmeContent.includes('curl');
      const hasPostman = readmeContent.toLowerCase().includes('postman');
      expect(hasCurl || hasPostman).toBe(true);
    });

    it('should mention signup endpoint', () => {
      expect(readmeContent).toMatch(/\/users\/signup|signup.*endpoint/i);
    });

    it('should mention signin endpoint', () => {
      expect(readmeContent).toMatch(/\/users\/signin|signin.*endpoint/i);
    });

    it('should mention profile endpoint', () => {
      expect(readmeContent).toMatch(/\/users\/profile|profile.*endpoint/i);
    });

    it('should include Authorization header example', () => {
      expect(readmeContent).toMatch(/Authorization.*Bearer|Bearer.*token/i);
    });
  });

  describe('Developer Workflow', () => {
    it('should mention branching strategy', () => {
      expect(readmeContent).toMatch(/branch|git checkout/i);
    });

    it('should mention environment variables', () => {
      const hasEnv = readmeContent.toLowerCase().includes('.env') ||
                    readmeContent.toLowerCase().includes('environment variable');
      expect(hasEnv).toBe(true);
    });

    it('should mention DEV_NAME variable', () => {
      expect(readmeContent).toContain('DEV_NAME');
    });

    it('should include pull request workflow', () => {
      expect(readmeContent.toLowerCase()).toMatch(/pull request|pr|merge/);
    });
  });

  describe('Troubleshooting Section', () => {
    it('should have troubleshooting or common issues section', () => {
      const hasTroubleshooting = readmeContent.toLowerCase().includes('troubleshooting');
      const hasCommonIssues = readmeContent.toLowerCase().includes('common issues');
      const hasIssues = readmeContent.toLowerCase().includes('issue');
      expect(hasTroubleshooting || hasCommonIssues || hasIssues).toBe(true);
    });

    it('should mention potential errors', () => {
      expect(readmeContent.toLowerCase()).toMatch(/error|exception|issue/);
    });

    it('should provide solutions or fixes', () => {
      expect(readmeContent.toLowerCase()).toMatch(/fix|solution|resolve/);
    });
  });

  describe('Links and References', () => {
    it('should not contain broken markdown links', () => {
      // Match markdown links: [text](url)
      const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      const links = readmeContent.match(linkPattern);
      
      if (links) {
        links.forEach(link => {
          // Extract URL from markdown link
          const urlMatch = link.match(/\]\(([^)]+)\)/);
          if (urlMatch) {
            const url = urlMatch[1];
            // Check that URL is not empty
            expect(url.trim().length).toBeGreaterThan(0);
            // Check that URL doesn't contain spaces (unless it's an anchor)
            if (!url.startsWith('#')) {
              expect(url).not.toMatch(/\s/);
            }
          }
        });
      }
    });

    it('should include external documentation links', () => {
      expect(readmeContent).toMatch(/https?:\/\//);
    });

    it('should reference AWS documentation', () => {
      expect(readmeContent).toMatch(/aws\.amazon\.com|docs\.aws\.amazon\.com/);
    });
  });

  describe('Formatting and Style', () => {
    it('should use proper heading hierarchy', () => {
      const headings = readmeContent.match(/^#{1,6}\s+.+$/gm);
      expect(headings).toBeTruthy();
      expect(headings!.length).toBeGreaterThan(3);
    });

    it('should have consistent list formatting', () => {
      // Check for lists (unordered or ordered)
      const hasLists = readmeContent.match(/^[\s]*[-*+]\s+.+$|^[\s]*\d+\.\s+.+$/m);
      expect(hasLists).toBeTruthy();
    });

    it('should not have multiple consecutive blank lines', () => {
      expect(readmeContent).not.toMatch(/\n\n\n\n/);
    });

    it('should end with a newline', () => {
      expect(readmeContent.endsWith('\n')).toBe(true);
    });
  });

  describe('Security Considerations', () => {
    it('should not contain hardcoded credentials', () => {
      // Check for potential AWS credentials
      expect(readmeContent).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(readmeContent).not.toMatch(/aws_secret_access_key\s*=\s*[^\s]+/);
    });

    it('should not contain real email addresses (use examples)', () => {
      // Allow example domains
      const realEmailPattern = /@(?!example\.com|test\.com|domain\.com)[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
      const matches = readmeContent.match(realEmailPattern);
      // Filter out markdown link anchors and common documentation sites
      const suspiciousEmails = matches?.filter(match => 
        !match.includes('@aws.') && 
        !match.includes('@github.') &&
        !match.includes('mailto:')
      );
      expect(suspiciousEmails?.length || 0).toBe(0);
    });

    it('should not contain real account IDs outside of example context', () => {
      // Look for 12-digit AWS account IDs
      const accountIdMatches = readmeContent.match(/\b\d{12}\b/g);
      if (accountIdMatches) {
        accountIdMatches.forEach(accountId => {
          // Check if it's in an example context
          const context = readmeContent.substring(
            Math.max(0, readmeContent.indexOf(accountId) - 100),
            Math.min(readmeContent.length, readmeContent.indexOf(accountId) + 100)
          );
          const isExample = context.toLowerCase().includes('example') ||
                           context.includes('123456789012') ||
                           context.includes('your-aws-account-id') ||
                           context.includes('<') ||
                           accountId === '123456789012';
          expect(isExample).toBe(true);
        });
      }
    });
  });

  describe('Completeness', () => {
    it('should mention Node.js version requirement', () => {
      expect(readmeContent).toMatch(/node.*\d+|nodejs.*\d+/i);
    });

    it('should mention repository cloning', () => {
      expect(readmeContent).toMatch(/git clone|clone.*repository/i);
    });

    it('should include contact or maintainer information', () => {
      const hasContact = readmeContent.toLowerCase().includes('contact') ||
                        readmeContent.toLowerCase().includes('maintainer') ||
                        readmeContent.toLowerCase().includes('questions');
      expect(hasContact).toBe(true);
    });

    it('should mention GitHub Actions or CI/CD', () => {
      const hasCI = readmeContent.toLowerCase().includes('github actions') ||
                   readmeContent.toLowerCase().includes('ci/cd') ||
                   readmeContent.toLowerCase().includes('pipeline');
      expect(hasCI).toBe(true);
    });
  });

  describe('Examples and Placeholders', () => {
    it('should use placeholders for user-specific values', () => {
      const hasPlaceholders = readmeContent.includes('<') && readmeContent.includes('>');
      expect(hasPlaceholders).toBe(true);
    });

    it('should provide clear examples', () => {
      expect(readmeContent).toMatch(/example:|for example|e\.g\.|such as/i);
    });

    it('should distinguish between placeholder and actual values', () => {
      // If there are angle brackets, they should be used consistently
      const placeholders = readmeContent.match(/<[^>]+>/g);
      if (placeholders) {
        expect(placeholders.length).toBeGreaterThan(0);
        // Each placeholder should be meaningful
        placeholders.forEach(placeholder => {
          expect(placeholder.length).toBeGreaterThan(3); // More than just <>
        });
      }
    });
  });

  describe('CLI Command Validity', () => {
    it('should use valid CDK commands', () => {
      const cdkCommands = readmeContent.match(/cdk\s+\w+/g);
      if (cdkCommands) {
        const validCommands = ['deploy', 'destroy', 'synth', 'bootstrap', 'diff', 'list', 'init'];
        cdkCommands.forEach(cmd => {
          const command = cmd.split(/\s+/)[1];
          expect(validCommands).toContain(command);
        });
      }
    });

    it('should use valid npm commands', () => {
      const npmCommands = readmeContent.match(/npm\s+\w+/g);
      if (npmCommands) {
        const validCommands = ['install', 'ci', 'test', 'run', 'start', 'build'];
        npmCommands.forEach(cmd => {
          const command = cmd.split(/\s+/)[1];
          expect(validCommands).toContain(command);
        });
      }
    });

    it('should include proper flag syntax', () => {
      // Check that flags are properly formatted
      const flags = readmeContent.match(/--\w+/g);
      if (flags) {
        flags.forEach(flag => {
          // Flags should not have spaces
          expect(flag).not.toMatch(/\s/);
          // Should start with --
          expect(flag.startsWith('--')).toBe(true);
        });
      }
    });
  });
});