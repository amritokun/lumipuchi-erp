# Security

Contact: [security@lumipuchi.in](mailto:security@lumipuchi.in)

Based on [https://supabase.com/.well-known/security.txt](https://supabase.com/.well-known/security.txt) and adapted from Cal.com

At Lumipuchi ERP, we consider the security of our systems a top priority. But no matter how much effort we put into system security, there can still be vulnerabilities present.

If you discover a vulnerability, we would like to know about it so we can take steps to address it as quickly as possible. We would like to ask you to help us better protect our sellers and our systems.

## Out of scope vulnerabilities

- Clickjacking on pages with no sensitive actions.
- Unauthenticated/logout/login CSRF.
- Attacks requiring MITM or physical access to a user's device.
- Any activity that could lead to the disruption of our service (DoS).
- Content spoofing and text injection issues without showing an attack vector/without being able to modify HTML/CSS.
- Email spoofing
- Missing DNSSEC, CAA, CSP headers
- Lack of Secure or HTTP only flag on non-sensitive cookies
- Dead links

## Please do the following

- E-mail your findings to [security@lumipuchi.in](mailto:security@lumipuchi.in).
- Do not run automated scanners on our infrastructure or dashboard. If you wish to do this, contact us and we will set up a sandbox for you.
- Do not take advantage of the vulnerability or problem you have discovered, for example by downloading more data than necessary to demonstrate the vulnerability or deleting or modifying other people's data.
- Do not reveal the problem to others until it has been resolved.
- Do not use attacks on physical security, social engineering, distributed denial of service, spam or applications of third parties.

## What we promise

- We will respond to your report within 3 business days with our evaluation of the report and an expected resolution date.
- If you have followed the instructions above, we will not take any legal action against you in regard to the report.
- We will handle your report with strict confidentiality.
