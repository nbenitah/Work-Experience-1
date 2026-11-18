const fs = require('fs');
const path = require('path');

const destination = process.argv[2];
if (!destination) {
  throw new Error('Provide a destination directory for the static site.');
}
if (fs.existsSync(destination)) {
  throw new Error('The destination directory already exists.');
}

const source = path.join(__dirname, '..', 'public');
const contactPath = path.join(source, 'contact.html');
const contact = fs.readFileSync(contactPath, 'utf8');
const formPattern = /<form class="contact-form" id="contact-form"[\s\S]*?<\/form>/;
const scriptPattern = /  <script src="js\/contact\.js"><\/script>\r?\n/;

if (!formPattern.test(contact) || !scriptPattern.test(contact)) {
  throw new Error('The contact page did not contain the expected form and script.');
}

const staticContact = contact
  .replace(formPattern, '<div class="contact-form"><p>The contact form is unavailable on this static site. Please <a href="mailto:hello@calicomedia.co">email us</a> instead.</p></div>')
  .replace(scriptPattern, '');

fs.cpSync(source, destination, { recursive: true, errorOnExist: true, force: false });
fs.writeFileSync(path.join(destination, 'contact.html'), staticContact);
