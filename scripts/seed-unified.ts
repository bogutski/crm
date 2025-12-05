/**
 * Unified Seed Script - Realistic CRM Database Seeding
 *
 * Usage:
 *   npm run seed:unified                     # Normal mode: 1000 contacts
 *   npm run seed:unified -- --extreme        # Extreme mode: 100,000 contacts
 *   npm run seed:unified -- --count=5000     # Custom count
 *   npm run seed:unified -- --extreme --count=50000  # Custom extreme
 *
 * Features:
 * - Creates all dictionaries (contact types, sources, industries, priorities)
 * - Contacts with realistic field distribution
 * - Opportunities with realistic deal names and notes
 * - Projects with tasks
 * - Realistic messaging history
 * - SMS conversation for testing
 *
 * Uses direct MongoDB insertMany for maximum performance.
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker/locale/en_US';
import { formatPhoneInternational } from '../lib/phone-format';

// Load .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

// ==================== CLI ARGS ====================

const args = process.argv.slice(2);
const isExtreme = args.includes('--extreme');
const countArg = args.find(a => a.startsWith('--count='));
const customCount = countArg ? parseInt(countArg.split('=')[1], 10) : null;

// Default counts based on mode
const DEFAULT_COUNTS = {
  normal: {
    contacts: 1000,
    opportunitiesPerContact: { min: 0, max: 5 },
    projects: 5,
    tasksPerProject: 10,
    standaloneTasks: 10,
    contactTasksCount: 20,
  },
  extreme: {
    contacts: 100_000,
    opportunitiesPerContact: { min: 0, max: 3 },
    projects: 20,
    tasksPerProject: 50,
    standaloneTasks: 100,
    contactTasksCount: 500,
  },
};

const MODE = isExtreme ? 'extreme' : 'normal';
const COUNTS = DEFAULT_COUNTS[MODE];
const CONTACT_COUNT = customCount || COUNTS.contacts;
const BATCH_SIZE = isExtreme ? 5000 : 100;

console.log(`\nMode: ${MODE.toUpperCase()}`);
console.log(`Contacts: ${CONTACT_COUNT.toLocaleString()}`);

// ==================== IMPORT MODELS ====================

import User from '../modules/user/model';
import Contact from '../modules/contact/model';
import { Pipeline, PipelineStage } from '../modules/pipeline/model';
import Opportunity from '../modules/opportunity/model';
import { Channel } from '../modules/channel/model';
import { Interaction } from '../modules/interaction/model';
import { Dictionary, DictionaryItem } from '../modules/dictionary/model';
import Project from '../modules/project/model';
import Task from '../modules/task/model';
import { SystemSettings } from '../modules/system-settings/model';

// ==================== DICTIONARIES DATA ====================

const DICTIONARIES = [
  {
    code: 'contact_types',
    name: 'Contact Types',
    description: 'Contact categorization by type',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Color', type: 'color' as const, required: true }],
    items: [
      { code: 'client', name: 'Client', properties: { color: '#22c55e' } },
      { code: 'lead', name: 'Lead', properties: { color: '#3b82f6' } },
      { code: 'partner', name: 'Partner', properties: { color: '#a855f7' } },
      { code: 'supplier', name: 'Supplier', properties: { color: '#f97316' } },
      { code: 'vip', name: 'VIP', properties: { color: '#ffd700' } },
      { code: 'prospect', name: 'Prospect', properties: { color: '#6b7280' } },
    ],
  },
  {
    code: 'sources',
    name: 'Lead Sources',
    description: 'Where the contact came from',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Color', type: 'color' as const, required: false }],
    items: [
      { code: 'website', name: 'Website', properties: { color: '#3b82f6' } },
      { code: 'ads', name: 'Paid Ads', properties: { color: '#f97316' } },
      { code: 'referral', name: 'Referral', properties: { color: '#22c55e' } },
      { code: 'cold_call', name: 'Cold Call', properties: { color: '#6b7280' } },
      { code: 'tradeshow', name: 'Trade Show', properties: { color: '#a855f7' } },
      { code: 'social', name: 'Social Media', properties: { color: '#ec4899' } },
      { code: 'linkedin', name: 'LinkedIn', properties: { color: '#0a66c2' } },
      { code: 'email_campaign', name: 'Email Campaign', properties: { color: '#eab308' } },
      { code: 'webinar', name: 'Webinar', properties: { color: '#14b8a6' } },
      { code: 'partner_referral', name: 'Partner Referral', properties: { color: '#8b5cf6' } },
    ],
  },
  {
    code: 'industries',
    name: 'Industries',
    description: 'Business industries',
    allowHierarchy: true,
    maxDepth: 2,
    fields: [],
    items: [
      { name: 'Technology', children: ['Software Development', 'IT Services', 'Cloud Computing', 'Cybersecurity', 'AI & Machine Learning'] },
      { name: 'Retail', children: ['E-commerce', 'Fashion & Apparel', 'Consumer Electronics', 'Food & Beverage'] },
      { name: 'Finance', children: ['Banking', 'Insurance', 'Investment Management', 'Fintech'] },
      { name: 'Manufacturing', children: ['Industrial Equipment', 'Automotive', 'Aerospace', 'Electronics Manufacturing'] },
      { name: 'Healthcare', children: ['Hospitals & Clinics', 'Pharmaceuticals', 'Medical Devices', 'Healthtech'] },
      { name: 'Real Estate', children: ['Commercial', 'Residential', 'Property Management'] },
      { name: 'Professional Services', children: ['Legal', 'Consulting', 'Accounting', 'Marketing & Advertising'] },
      { name: 'Education', children: ['Higher Education', 'K-12', 'EdTech', 'Corporate Training'] },
    ],
  },
  {
    code: 'opportunity_priority',
    name: 'Deal Priority',
    description: 'Priority levels for deals',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Color', type: 'color' as const, required: true }],
    items: [
      { code: 'low', name: 'Low', properties: { color: '#6b7280' } },
      { code: 'medium', name: 'Medium', properties: { color: '#eab308' } },
      { code: 'high', name: 'High', properties: { color: '#f97316' } },
      { code: 'critical', name: 'Critical', properties: { color: '#ef4444' } },
    ],
  },
  {
    code: 'task_priority',
    name: 'Task Priority',
    description: 'Priority levels for tasks',
    allowHierarchy: false,
    fields: [{ code: 'color', name: 'Color', type: 'color' as const, required: true }],
    items: [
      { code: 'low', name: 'Low', properties: { color: '#6b7280' } },
      { code: 'medium', name: 'Medium', properties: { color: '#eab308' } },
      { code: 'high', name: 'High', properties: { color: '#f97316' } },
      { code: 'urgent', name: 'Urgent', properties: { color: '#ef4444' } },
    ],
  },
];

// ==================== CHANNELS DATA ====================

const CHANNELS_DATA = [
  { code: 'sms', name: 'SMS', icon: 'smartphone', color: '#22c55e' },
  { code: 'email', name: 'Email', icon: 'mail', color: '#3b82f6' },
  { code: 'telegram', name: 'Telegram', icon: 'send', color: '#0088cc' },
  { code: 'whatsapp', name: 'WhatsApp', icon: 'message-circle', color: '#25d366' },
  { code: 'facebook', name: 'Facebook Messenger', icon: 'message-square', color: '#0084ff' },
  { code: 'instagram', name: 'Instagram DM', icon: 'camera', color: '#e4405f' },
  { code: 'webchat', name: 'Live Chat', icon: 'globe', color: '#6366f1' },
  { code: 'phone', name: 'Phone Call', icon: 'phone-call', color: '#f97316' },
  { code: 'zoom', name: 'Zoom', icon: 'video', color: '#2d8cff' },
  { code: 'linkedin', name: 'LinkedIn', icon: 'briefcase', color: '#0a66c2' },
  { code: 'slack', name: 'Slack', icon: 'hash', color: '#4a154b' },
];

// ==================== PIPELINES DATA ====================

const PIPELINES_DATA = [
  {
    name: 'Enterprise Sales',
    code: 'enterprise_sales',
    description: 'High-value enterprise client pipeline',
    isDefault: true,
    stages: [
      { code: 'discovery', name: 'Discovery', color: '#6b7280', probability: 5, isInitial: true },
      { code: 'qualification', name: 'Qualification', color: '#3b82f6', probability: 15 },
      { code: 'needs_analysis', name: 'Needs Analysis', color: '#8b5cf6', probability: 30 },
      { code: 'proposal', name: 'Proposal', color: '#f97316', probability: 50 },
      { code: 'negotiation', name: 'Negotiation', color: '#eab308', probability: 70 },
      { code: 'contract', name: 'Contract Review', color: '#14b8a6', probability: 85 },
      { code: 'won', name: 'Closed Won', color: '#22c55e', probability: 100, isFinal: true, isWon: true },
      { code: 'lost', name: 'Closed Lost', color: '#ef4444', probability: 0, isFinal: true },
    ],
  },
  {
    name: 'SMB Sales',
    code: 'smb_sales',
    description: 'Small and medium business pipeline',
    isDefault: false,
    stages: [
      { code: 'lead', name: 'New Lead', color: '#6b7280', probability: 10, isInitial: true },
      { code: 'contacted', name: 'Contacted', color: '#3b82f6', probability: 25 },
      { code: 'demo', name: 'Demo Scheduled', color: '#8b5cf6', probability: 45 },
      { code: 'proposal', name: 'Proposal Sent', color: '#f97316', probability: 65 },
      { code: 'negotiation', name: 'Negotiation', color: '#eab308', probability: 80 },
      { code: 'won', name: 'Closed Won', color: '#22c55e', probability: 100, isFinal: true, isWon: true },
      { code: 'lost', name: 'Closed Lost', color: '#ef4444', probability: 0, isFinal: true },
    ],
  },
  {
    name: 'Partnerships',
    code: 'partnerships',
    description: 'Strategic partnerships and alliances',
    isDefault: false,
    stages: [
      { code: 'identified', name: 'Partner Identified', color: '#6b7280', probability: 10, isInitial: true },
      { code: 'outreach', name: 'Initial Outreach', color: '#3b82f6', probability: 20 },
      { code: 'discussion', name: 'In Discussion', color: '#8b5cf6', probability: 40 },
      { code: 'terms', name: 'Terms Negotiation', color: '#f97316', probability: 60 },
      { code: 'legal', name: 'Legal Review', color: '#eab308', probability: 80 },
      { code: 'signed', name: 'Agreement Signed', color: '#22c55e', probability: 100, isFinal: true, isWon: true },
      { code: 'declined', name: 'Declined', color: '#ef4444', probability: 0, isFinal: true },
    ],
  },
];

// ==================== MANAGERS DATA ====================

const MANAGERS_DATA = [
  { name: 'Michael Thompson', email: 'm.thompson@company.com' },
  { name: 'Sarah Mitchell', email: 's.mitchell@company.com' },
  { name: 'James Rodriguez', email: 'j.rodriguez@company.com' },
  { name: 'Emily Chen', email: 'e.chen@company.com' },
  { name: 'David Williams', email: 'd.williams@company.com' },
  { name: 'Jennifer Anderson', email: 'j.anderson@company.com' },
  { name: 'Robert Martinez', email: 'r.martinez@company.com' },
  { name: 'Amanda Taylor', email: 'a.taylor@company.com' },
];

// ==================== PROJECTS DATA ====================

const PROJECTS_DATA = [
  { name: 'Q1 Revenue Push', description: 'Focus on closing high-value deals to meet quarterly targets', status: 'active' as const, daysOffset: 45 },
  { name: 'Customer Success Initiative', description: 'Improve customer retention and satisfaction scores', status: 'active' as const, daysOffset: 60 },
  { name: 'New Market Expansion', description: 'Expand into healthcare and financial services verticals', status: 'active' as const, daysOffset: 90 },
  { name: 'Partner Enablement Program', description: 'Train and enable channel partners on new product features', status: 'active' as const, daysOffset: 30 },
  { name: 'Lead Generation Campaign', description: 'Multi-channel campaign targeting enterprise prospects', status: 'on_hold' as const, daysOffset: 75 },
];

// ==================== REALISTIC DATA TEMPLATES ====================

// Company name prefixes and suffixes for realistic company names
const COMPANY_PREFIXES = [
  'Global', 'Advanced', 'Premier', 'Strategic', 'Innovative', 'Dynamic', 'Integrated', 'Unified',
  'NextGen', 'Elite', 'Peak', 'Summit', 'Apex', 'Prime', 'Core', 'Vertex', 'Nexus', 'Horizon',
  'Blue', 'Silver', 'Golden', 'Sterling', 'Cardinal', 'Pacific', 'Atlantic', 'Northern', 'Western',
];

const COMPANY_CORES = [
  'Tech', 'Solutions', 'Systems', 'Services', 'Consulting', 'Partners', 'Group', 'Industries',
  'Digital', 'Media', 'Analytics', 'Capital', 'Ventures', 'Labs', 'Works', 'Dynamics',
  'Logic', 'Soft', 'Net', 'Cloud', 'Data', 'Info', 'Cyber', 'Smart',
];

const COMPANY_SUFFIXES = ['Inc', 'LLC', 'Corp', 'Co', 'Ltd', 'Group', 'Holdings', ''];

// Realistic US company names
const REAL_COMPANY_NAMES = [
  'Acme Corporation', 'Stellar Dynamics', 'Quantum Solutions', 'Apex Industries', 'Pinnacle Group',
  'Velocity Partners', 'Catalyst Consulting', 'Synergy Systems', 'Momentum Labs', 'Precision Tech',
  'Fusion Analytics', 'Elevate Solutions', 'Prodigy Software', 'Vanguard Technologies', 'Pathfinder Inc',
  'Summit Enterprises', 'Beacon Digital', 'Trailblazer Media', 'Keystone Partners', 'Milestone Group',
  'Northstar Consulting', 'Redwood Systems', 'Clearwater Tech', 'Ironclad Security', 'Brightwave Digital',
  'Cornerstone Solutions', 'Stonebridge Capital', 'Evergreen Partners', 'Whitepeak Analytics', 'Bluechip Ventures',
];

function generateCompanyName(): string {
  const rand = Math.random();
  if (rand < 0.3) {
    // Use realistic company names
    return randomElement(REAL_COMPANY_NAMES);
  } else if (rand < 0.6) {
    // Generate compound name
    const prefix = randomElement(COMPANY_PREFIXES);
    const core = randomElement(COMPANY_CORES);
    const suffix = randomElement(COMPANY_SUFFIXES);
    return suffix ? `${prefix} ${core} ${suffix}` : `${prefix} ${core}`;
  } else {
    // Use faker with US locale
    return faker.company.name();
  }
}

// Contact notes templates
const CONTACT_NOTES_TEMPLATES = [
  // Meeting notes
  'Had initial discovery call. {name} is evaluating solutions for their {department} team. Budget approved for Q{quarter}.',
  'Met at {event} conference. Very interested in our {product} offering. Requested follow-up demo.',
  'Great call today. {name} mentioned they are currently using {competitor} but not satisfied with support.',
  'Introduced by {referrer}. Looking to replace legacy system within {timeframe} months.',
  'Connected on LinkedIn. {name} has been following our content for a while. Ready to explore partnership.',

  // Decision maker info
  'Key decision maker for {department}. Reports directly to CEO. Has final sign-off on purchases over ${amount}k.',
  'Influencer in the buying process. Works closely with {role} who makes final decisions.',
  'Champion internally. Already advocating for our solution to the leadership team.',
  'Technical evaluator. Will be conducting the proof of concept with their team.',
  'Executive sponsor for the project. Has allocated budget from {department} for this initiative.',

  // Requirements & pain points
  'Main pain points: manual processes, lack of visibility, difficulty scaling current solution.',
  'Requirements: must integrate with Salesforce, needs SSO support, looking for 24/7 support.',
  'Current challenges include long implementation times and poor user adoption with existing tools.',
  'Looking for a solution that can handle {number}+ users with real-time collaboration features.',
  'Critical requirement: SOC 2 compliance. Also needs HIPAA compliance for healthcare clients.',

  // Follow-up notes
  'Sent proposal on {date}. Follow up scheduled for next week to discuss pricing.',
  'Waiting on legal review. {name} expects approval by end of month.',
  'On vacation until {date}. Will reconnect after they return to finalize details.',
  'Internal budget meeting scheduled for {date}. Our proposal is on the agenda.',
  'Trial started. First check-in call scheduled for {date} to review progress.',

  // Relationship notes
  'Long-term relationship potential. Company is growing fast and may expand usage significantly.',
  'Prefers email communication. Usually responds within 24 hours during business days.',
  'Best time to reach: mornings EST. Tends to be in meetings after 2pm.',
  'Very detail-oriented. Appreciates thorough documentation and case studies.',
  'Fast decision maker. If we can show clear ROI, they will move quickly.',
];

function generateContactNotes(contactName: string): string | undefined {
  if (Math.random() > 0.4) return undefined; // 60% have no notes

  const template = randomElement(CONTACT_NOTES_TEMPLATES);
  const firstName = contactName.split(' ')[0];

  return template
    .replace('{name}', firstName)
    .replace('{department}', randomElement(['sales', 'marketing', 'operations', 'engineering', 'finance', 'HR']))
    .replace('{quarter}', String(faker.number.int({ min: 1, max: 4 })))
    .replace('{event}', randomElement(['SaaS North', 'Dreamforce', 'Web Summit', 'TechCrunch Disrupt', 'AWS re:Invent']))
    .replace('{product}', randomElement(['CRM', 'analytics', 'automation', 'integration']))
    .replace('{competitor}', randomElement(['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Monday.com']))
    .replace('{referrer}', faker.person.fullName())
    .replace('{timeframe}', String(faker.number.int({ min: 3, max: 12 })))
    .replace('{role}', randomElement(['VP of Sales', 'CTO', 'CFO', 'Head of Operations', 'Director of IT']))
    .replace('{amount}', String(faker.number.int({ min: 10, max: 100 })))
    .replace('{number}', String(faker.number.int({ min: 50, max: 500 })))
    .replace('{date}', faker.date.soon({ days: 14 }).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
}

// Opportunity name templates
const OPPORTUNITY_TEMPLATES = [
  // Product/Service based
  '{company} - CRM Implementation',
  '{company} - Enterprise License',
  '{company} - Professional Services',
  '{company} - Platform Migration',
  '{company} - Annual Renewal',
  '{company} - Expansion Deal',
  '{company} - Pilot Program',
  '{company} - Custom Development',
  '{company} - Integration Project',
  '{company} - Training Package',

  // Department specific
  '{company} Sales Team - {seats} Seats',
  '{company} Marketing - Analytics Suite',
  '{company} Operations - Automation',
  '{company} IT - Security Add-on',
  '{company} HR - Employee Portal',

  // Deal type specific
  '{company} - Q{quarter} Upsell',
  '{company} - Multi-year Agreement',
  '{company} - POC to Production',
  '{company} - Competitive Replacement',
  '{company} - New Business',
];

function generateOpportunityName(companyName: string): string {
  const template = randomElement(OPPORTUNITY_TEMPLATES);
  return template
    .replace('{company}', companyName || faker.company.name())
    .replace('{seats}', String(faker.number.int({ min: 10, max: 200 })))
    .replace('{quarter}', String(faker.number.int({ min: 1, max: 4 })));
}

// Opportunity notes templates
const OPPORTUNITY_NOTES_TEMPLATES = [
  // Deal context
  'Initial budget: ${budget}. Timeline: Close by end of Q{quarter}. Competition: {competitor}.',
  'Decision committee: {role1}, {role2}, and procurement. Expect 3-4 week evaluation cycle.',
  'Replacing {competitor}. Main drivers: better integrations, improved UX, and cost savings.',
  'New initiative from the board. {role1} is championing this project internally.',
  'Part of a larger digital transformation. This deal could expand to ${upsell}+ in year 2.',

  // Pricing & commercial
  'Proposed pricing: ${price}/user/month. Includes premium support and onboarding.',
  'Negotiating enterprise discount. Standard pricing too high for their budget.',
  'Multi-year deal discussion. Offering 15% discount for 3-year commitment.',
  'Need to match competitor pricing at ${price}/user to win. Getting approval from finance.',
  'Payment terms: Net 60 requested. May need to escalate for approval.',

  // Technical requirements
  'Technical requirements: API access, SSO (Okta), data residency in US.',
  'Integration needs: Salesforce, Slack, and custom ERP. API documentation shared.',
  'Security review in progress. Sent SOC 2 report and completed vendor questionnaire.',
  'POC criteria defined: handle 10k records import, sub-2s page loads, 99.9% uptime.',
  'Custom reporting requirements discussed. May need professional services engagement.',

  // Next steps
  'Next steps: Executive presentation on {date}. Need to prepare ROI business case.',
  'Contract in legal review. Expected redlines by {date}. Procurement contact: {name}.',
  'Demo completed successfully. Sending proposal this week with custom pricing.',
  'Champion meeting with CFO tomorrow. Coaching them on budget justification.',
  'Final negotiation call scheduled. Likely to close if we can agree on payment terms.',

  // Blockers & risks
  'Risk: Budget freeze until April. May need to offer extended payment terms.',
  'Blocker: IT team wants competitor due to existing relationship. Need executive sponsorship.',
  'Delay expected: Key stakeholder on leave until {date}. Maintaining relationship with team.',
  'Competition strong: {competitor} offering deep discount. Need to differentiate on value.',
  'Legal concerns about data processing. Scheduling call with their DPO.',
];

function generateOpportunityNotes(): string | undefined {
  if (Math.random() > 0.5) return undefined; // 50% have no notes

  const template = randomElement(OPPORTUNITY_NOTES_TEMPLATES);

  return template
    .replace('{budget}', faker.number.int({ min: 50, max: 500 }) + 'k')
    .replace('{quarter}', String(faker.number.int({ min: 1, max: 4 })))
    .replace('{competitor}', randomElement(['Salesforce', 'HubSpot', 'Zoho', 'Pipedrive', 'Microsoft Dynamics']))
    .replace('{role1}', randomElement(['VP of Sales', 'CTO', 'COO', 'Head of Operations']))
    .replace('{role2}', randomElement(['CFO', 'Director of IT', 'Head of Procurement', 'Legal Counsel']))
    .replace('{upsell}', String(faker.number.int({ min: 100, max: 500 })) + 'k')
    .replace('{price}', String(faker.number.int({ min: 25, max: 150 })))
    .replace('{date}', faker.date.soon({ days: 21 }).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    .replace('{name}', faker.person.fullName());
}

// Interaction message templates
const MESSAGE_TEMPLATES = {
  inbound: {
    inquiry: [
      "Hi, I came across your website and I'm interested in learning more about your CRM solution. Can someone give me a call?",
      "We're currently evaluating CRM platforms for our sales team. What makes your product different from Salesforce?",
      "I was referred by a colleague who uses your platform. Can you send me some information about pricing?",
      "Saw your presentation at the conference last week. Would love to schedule a demo for our team.",
      "We need a CRM that integrates with our existing tools. Do you support Zapier and API access?",
      "Looking to upgrade from our current system. How does migration work?",
      "Our contract with [competitor] is ending. Interested in switching. What's the process?",
      "Need a solution for 50+ sales reps. Do you offer volume discounts?",
    ],
    followUp: [
      "Thanks for the demo yesterday. I've shared the recording with my team. When can we discuss pricing?",
      "Just got budget approval. Ready to move forward. What are the next steps?",
      "Had a great discussion with our IT team. They have some technical questions about the API.",
      "The team loved the demo. Can we get trial access for a small group?",
      "Following up on the proposal. I have a few questions about the implementation timeline.",
      "Legal has reviewed the contract. We have a few minor redlines to discuss.",
      "We're ready to sign. Can you send the final contract?",
      "Quick question - does the enterprise plan include priority support?",
    ],
    support: [
      "Having trouble with the data import. Can someone help?",
      "Need to reschedule our call. Something came up. How's Thursday?",
      "Can you resend the proposal? I can't find it in my inbox.",
      "Is there documentation on setting up the Salesforce integration?",
      "Who should I contact about billing questions?",
      "The link in your email isn't working. Can you resend?",
    ],
    brief: [
      "Got it, thanks!",
      "Sounds good.",
      "Perfect, talk soon.",
      "Makes sense. Let me check with the team.",
      "Confirmed.",
      "Works for me.",
      "Received, thanks!",
      "Looking forward to it.",
      "Will do.",
      "Understood.",
    ],
  },
  outbound: {
    initial: [
      "Hi {name}, thanks for reaching out! I'd be happy to schedule a call to discuss your needs. How does Tuesday at 2pm work?",
      "Thanks for your interest in our platform. Based on what you mentioned, I think our Enterprise plan would be a great fit. Want me to set up a demo?",
      "Great to connect! I noticed you're in {industry} - we have several customers in your space. Would a case study be helpful?",
      "Hi {name}, I received your inquiry. Before we schedule a demo, I have a few quick questions to better understand your requirements.",
      "Thanks for the referral mention! I'd love to learn more about your team's needs. Are you available for a 15-min call this week?",
    ],
    followUp: [
      "Hi {name}, following up on our conversation. I've put together a custom proposal based on your requirements. When can we review it?",
      "Just checking in - did you have a chance to review the information I sent? Happy to answer any questions.",
      "Wanted to share a case study from a similar company in your industry. Think you'll find it relevant.",
      "Hi {name}, our technical team has prepared answers to the questions your IT team raised. Ready to schedule a call?",
      "Following up on the proposal. I know you mentioned discussing with your team - any updates?",
      "Just confirming our call for tomorrow at 3pm. Looking forward to discussing next steps.",
      "Wanted to touch base before the end of the quarter. Is there anything blocking us from moving forward?",
    ],
    closing: [
      "Great news! I've received approval for the discount we discussed. Ready to send the final contract whenever you are.",
      "Contract has been sent for signature. Let me know if you have any questions.",
      "Thanks for the signed contract! Your account is being set up now. You'll receive login credentials within 24 hours.",
      "Welcome aboard! I've scheduled your kickoff call with our implementation team for next Monday.",
    ],
    brief: [
      "Perfect, confirmed!",
      "Great, talk soon.",
      "Sounds good, I'll send it over.",
      "No problem at all.",
      "Looking forward to it!",
      "Got it, thanks for letting me know.",
      "Will follow up tomorrow.",
      "Thanks {name}!",
    ],
  },
};

function getMessageTemplate(direction: 'inbound' | 'outbound', contactName: string): string {
  const firstName = contactName.split(' ')[0];
  const templates = MESSAGE_TEMPLATES[direction];
  const rand = Math.random();

  let template: string;
  if (direction === 'inbound') {
    if (rand < 0.25) template = randomElement(templates.inquiry);
    else if (rand < 0.5) template = randomElement(templates.followUp);
    else if (rand < 0.65) template = randomElement(templates.support);
    else template = randomElement(templates.brief);
  } else {
    if (rand < 0.3) template = randomElement(templates.initial);
    else if (rand < 0.6) template = randomElement(templates.followUp);
    else if (rand < 0.7) template = randomElement(templates.closing);
    else template = randomElement(templates.brief);
  }

  return template
    .replace('{name}', firstName)
    .replace('{industry}', randomElement(['tech', 'healthcare', 'finance', 'retail', 'manufacturing']));
}

// Task templates
const TASK_TEMPLATES = {
  sales: [
    { title: 'Follow up on proposal', description: 'Review proposal status and address any outstanding questions. Check if decision timeline has changed.' },
    { title: 'Schedule discovery call', description: 'Reach out to schedule initial discovery call. Prepare questions about current pain points and budget.' },
    { title: 'Send demo recording', description: 'Share recorded demo with stakeholders who missed the live session. Include relevant case studies.' },
    { title: 'Prepare custom proposal', description: 'Create tailored proposal based on discovery call notes. Include ROI calculations and implementation timeline.' },
    { title: 'Check in on trial progress', description: 'Contact trial user to assess progress and gather feedback. Identify any blockers or concerns.' },
    { title: 'Negotiate contract terms', description: 'Review requested changes to contract terms. Prepare counter-proposal if needed.' },
    { title: 'Send pricing breakdown', description: 'Provide detailed pricing breakdown including all options discussed. Highlight any applicable discounts.' },
    { title: 'Coordinate executive meeting', description: 'Arrange meeting between executives. Brief leadership on opportunity and key talking points.' },
    { title: 'Update opportunity stage', description: 'Move deal to next stage in pipeline. Update notes with latest developments.' },
    { title: 'Competitive analysis request', description: 'Prepare comparison against main competitor mentioned. Focus on differentiating features.' },
  ],
  account: [
    { title: 'Quarterly business review', description: 'Schedule QBR to discuss usage, results, and expansion opportunities.' },
    { title: 'Check on user adoption', description: 'Review usage metrics and identify users who may need additional training or support.' },
    { title: 'Renewal discussion', description: 'Initiate renewal conversation 90 days before contract end. Discuss any changes needed.' },
    { title: 'Expansion opportunity', description: 'Discuss adding new users or features based on growth signals.' },
    { title: 'Customer reference request', description: 'Ask if customer would be willing to serve as reference for similar prospects.' },
    { title: 'Upsell consultation', description: 'Present additional features or higher tier that would benefit their use case.' },
  ],
  admin: [
    { title: 'Update CRM records', description: 'Ensure all contact and opportunity information is current and accurate.' },
    { title: 'Log meeting notes', description: 'Document key takeaways from recent meeting in CRM.' },
    { title: 'Generate weekly report', description: 'Compile weekly pipeline report for team meeting.' },
    { title: 'Clean up duplicate contacts', description: 'Identify and merge any duplicate contact records.' },
    { title: 'Review stale opportunities', description: 'Check opportunities with no activity in 30+ days. Update or archive as appropriate.' },
    { title: 'Document process', description: 'Update sales playbook with learnings from recent deals.' },
  ],
  outreach: [
    { title: 'LinkedIn connection request', description: 'Send personalized connection request to key contact.' },
    { title: 'Share industry article', description: 'Send relevant article that adds value and keeps relationship warm.' },
    { title: 'Event invitation', description: 'Invite contact to upcoming webinar or event.' },
    { title: 'Introduction request', description: 'Ask for introduction to another department or decision maker.' },
    { title: 'Reengagement email', description: 'Reach out to dormant lead with new value proposition or update.' },
    { title: 'Thank you note', description: 'Send thank you for their time and reconfirm next steps.' },
  ],
};

function generateTaskData(): { title: string; description: string } {
  const category = randomElement(Object.keys(TASK_TEMPLATES)) as keyof typeof TASK_TEMPLATES;
  return randomElement(TASK_TEMPLATES[category]);
}

// ==================== HELPERS ====================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function progressBar(current: number, total: number, label: string): void {
  const width = 40;
  const percent = current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percentStr = (percent * 100).toFixed(1).padStart(5);
  process.stdout.write(`\r   ${label}: [${bar}] ${percentStr}% (${current.toLocaleString()}/${total.toLocaleString()})`);
}

// ==================== DATA GENERATORS ====================

const phoneTypes: ('MOBILE' | 'FIXED_LINE' | 'UNKNOWN')[] = ['MOBILE', 'FIXED_LINE', 'UNKNOWN'];
const countries = ['US', 'US', 'US', 'US', 'CA', 'GB']; // Weighted towards US

interface DictItemIds {
  contactTypes: Map<string, mongoose.Types.ObjectId>;
  sources: Map<string, mongoose.Types.ObjectId>;
  industries: mongoose.Types.ObjectId[];
  opportunityPriorities: mongoose.Types.ObjectId[];
  taskPriorities: mongoose.Types.ObjectId[];
}

function generateContactDoc(
  ownerId: mongoose.Types.ObjectId,
  dictIds: DictItemIds
) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;

  // Realistic phone/email distribution:
  // - 45% have 1 phone and 1 email (standard contacts)
  // - 20% have 1 phone only (no email)
  // - 10% have 1 email only (no phone)
  // - 5% have neither (incomplete records)
  // - 20% have multiple phones/emails (detailed contacts)

  const distRand = Math.random();
  let phoneCount = 0;
  let emailCount = 0;

  if (distRand < 0.45) {
    // Standard: 1 phone, 1 email
    phoneCount = 1;
    emailCount = 1;
  } else if (distRand < 0.65) {
    // Phone only
    phoneCount = 1;
    emailCount = 0;
  } else if (distRand < 0.75) {
    // Email only
    phoneCount = 0;
    emailCount = 1;
  } else if (distRand < 0.80) {
    // Incomplete
    phoneCount = 0;
    emailCount = 0;
  } else {
    // Detailed contacts (20-25%)
    phoneCount = faker.number.int({ min: 1, max: 3 });
    emailCount = faker.number.int({ min: 1, max: 3 });
  }

  const emails = [];
  for (let i = 0; i < emailCount; i++) {
    const domain = i === 0 && Math.random() > 0.3
      ? faker.internet.domainName()
      : randomElement(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']);

    emails.push({
      address: i === 0
        ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`
        : faker.internet.email({ firstName, lastName }).toLowerCase(),
      isVerified: Math.random() > 0.6,
      isSubscribed: Math.random() > 0.3,
    });
  }

  const phones = [];
  for (let i = 0; i < phoneCount; i++) {
    // Generate realistic US phone numbers
    const areaCode = faker.helpers.arrayElement(['212', '310', '415', '617', '312', '713', '404', '206', '303', '512', '818', '949', '858', '619', '650', '408']);
    const phoneNumber = `+1${areaCode}${faker.string.numeric(7)}`;
    phones.push({
      e164: phoneNumber,
      international: formatPhoneInternational(phoneNumber),
      country: i === 0 ? 'US' : randomElement(countries),
      type: i === 0 ? 'MOBILE' : randomElement(phoneTypes),
      isPrimary: i === 0,
      isVerified: Math.random() > 0.7,
      isSubscribed: Math.random() > 0.2,
    });
  }

  // Company: 75% filled
  const hasCompany = Math.random() > 0.25;
  const company = hasCompany ? generateCompanyName() : undefined;

  // Position: 70% filled (only if has company)
  const position = hasCompany && Math.random() > 0.3 ? faker.person.jobTitle() : undefined;

  // Contact Type: 85% filled (leads are more common)
  const contactTypeCodes = Array.from(dictIds.contactTypes.keys());
  const contactTypeWeighted = Math.random();
  let contactTypeCode: string | undefined;
  if (Math.random() > 0.15) {
    if (contactTypeWeighted < 0.35) contactTypeCode = 'lead';
    else if (contactTypeWeighted < 0.55) contactTypeCode = 'prospect';
    else if (contactTypeWeighted < 0.75) contactTypeCode = 'client';
    else contactTypeCode = randomElement(contactTypeCodes);
  }
  const contactType = contactTypeCode ? dictIds.contactTypes.get(contactTypeCode) : undefined;

  // Source: 80% filled
  const sourceCodes = Array.from(dictIds.sources.keys());
  const sourceCode = Math.random() > 0.2 ? randomElement(sourceCodes) : undefined;
  const source = sourceCode ? dictIds.sources.get(sourceCode) : undefined;

  // Industry: 70% filled
  const industry = Math.random() > 0.3 && dictIds.industries.length > 0
    ? randomElement(dictIds.industries)
    : undefined;

  // Notes: 40% filled
  const notes = generateContactNotes(fullName);

  return {
    _id: new mongoose.Types.ObjectId(),
    name: fullName,
    emails,
    phones,
    company,
    position,
    contactType,
    source,
    industry,
    notes,
    ownerId,
    createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

const utmSources = ['google', 'facebook', 'linkedin', 'bing', 'twitter', null, null];
const utmMediums = ['cpc', 'organic', 'email', 'social', 'referral', null, null];
const utmCampaigns = ['spring_2024', 'enterprise_push', 'smb_outreach', 'brand_awareness', 'retargeting', null, null];

// Stage distribution for realistic pipeline
function getWeightedStageIndex(stageCount: number, pipelineType: string): number {
  const rand = Math.random();

  if (pipelineType === 'enterprise_sales') {
    // Enterprise: more deals in early stages
    if (rand < 0.25) return 0; // Discovery
    if (rand < 0.45) return 1; // Qualification
    if (rand < 0.60) return 2; // Needs Analysis
    if (rand < 0.75) return 3; // Proposal
    if (rand < 0.85) return 4; // Negotiation
    if (rand < 0.90) return 5; // Contract Review
    if (rand < 0.95) return 6; // Won
    return 7; // Lost
  } else if (pipelineType === 'smb_sales') {
    // SMB: faster movement through stages
    if (rand < 0.20) return 0; // Lead
    if (rand < 0.35) return 1; // Contacted
    if (rand < 0.50) return 2; // Demo
    if (rand < 0.70) return 3; // Proposal
    if (rand < 0.80) return 4; // Negotiation
    if (rand < 0.92) return 5; // Won
    return 6; // Lost
  } else {
    // Partnerships: different distribution
    if (rand < 0.15) return 0;
    if (rand < 0.35) return 1;
    if (rand < 0.55) return 2;
    if (rand < 0.70) return 3;
    if (rand < 0.82) return 4;
    if (rand < 0.93) return 5;
    return 6;
  }
}

interface StageInfo {
  id: mongoose.Types.ObjectId;
  pipelineId: mongoose.Types.ObjectId;
  pipelineCode: string;
  stageIndex: number;
}

function generateOpportunityDoc(
  contactId: mongoose.Types.ObjectId,
  contactCompany: string | undefined,
  priorityIds: mongoose.Types.ObjectId[],
  stages: StageInfo[],
  ownerId: mongoose.Types.ObjectId
) {
  // Group stages by pipeline
  const pipelineStages = new Map<string, StageInfo[]>();
  for (const stage of stages) {
    const existing = pipelineStages.get(stage.pipelineCode) || [];
    existing.push(stage);
    pipelineStages.set(stage.pipelineCode, existing);
  }

  // Select pipeline with weighting (60% enterprise, 30% SMB, 10% partnerships)
  const pipelineRand = Math.random();
  let selectedPipeline: string;
  if (pipelineRand < 0.6) selectedPipeline = 'enterprise_sales';
  else if (pipelineRand < 0.9) selectedPipeline = 'smb_sales';
  else selectedPipeline = 'partnerships';

  const pipelineStageList = pipelineStages.get(selectedPipeline) || stages;

  // Get weighted stage
  const stageIndex = getWeightedStageIndex(pipelineStageList.length, selectedPipeline);
  const stage = pipelineStageList[Math.min(stageIndex, pipelineStageList.length - 1)];

  const name = generateOpportunityName(contactCompany || faker.company.name());
  const utmSource = randomElement(utmSources);

  // Amount based on pipeline type
  let amount: number;
  if (selectedPipeline === 'enterprise_sales') {
    amount = faker.number.int({ min: 50000, max: 2000000 });
  } else if (selectedPipeline === 'smb_sales') {
    amount = faker.number.int({ min: 5000, max: 100000 });
  } else {
    amount = faker.number.int({ min: 10000, max: 500000 });
  }

  // Priority based on amount
  let priorityIndex: number;
  if (amount > 500000) priorityIndex = 3; // Critical
  else if (amount > 200000) priorityIndex = 2; // High
  else if (amount > 50000) priorityIndex = 1; // Medium
  else priorityIndex = 0; // Low

  const notes = generateOpportunityNotes();

  return {
    _id: new mongoose.Types.ObjectId(),
    name,
    amount,
    closingDate: faker.date.between({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    contact: contactId,
    priority: priorityIds[priorityIndex] || randomElement(priorityIds),
    pipelineId: stage.pipelineId,
    stageId: stage.id,
    ownerId,
    archived: false,
    notes,
    utm: utmSource ? {
      source: utmSource,
      medium: randomElement(utmMediums) || undefined,
      campaign: randomElement(utmCampaigns) || undefined,
    } : undefined,
    createdAt: faker.date.between({ from: '2023-01-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

function generateInteractionDoc(
  contactId: mongoose.Types.ObjectId,
  contactName: string,
  channelIds: mongoose.Types.ObjectId[],
  opportunityIds: mongoose.Types.ObjectId[],
  userId: mongoose.Types.ObjectId
) {
  const direction = Math.random() > 0.45 ? 'inbound' : 'outbound';
  const statuses = ['pending', 'sent', 'delivered', 'read'];
  const hasOpportunity = Math.random() > 0.5;

  return {
    _id: new mongoose.Types.ObjectId(),
    channelId: randomElement(channelIds),
    contactId,
    opportunityId: hasOpportunity && opportunityIds.length > 0 ? randomElement(opportunityIds) : undefined,
    direction,
    status: direction === 'inbound' ? 'delivered' : randomElement(statuses),
    content: getMessageTemplate(direction as 'inbound' | 'outbound', contactName),
    metadata: {},
    createdBy: direction === 'outbound' ? userId : undefined,
    createdAt: faker.date.between({ from: '2023-06-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

const taskStatuses = ['open', 'in_progress', 'completed', 'cancelled'] as const;

function generateTaskDoc(
  ownerId: mongoose.Types.ObjectId,
  priorityIds: mongoose.Types.ObjectId[],
  options: {
    projectId?: mongoose.Types.ObjectId;
    contactId?: mongoose.Types.ObjectId;
    title?: string;
    description?: string;
    status?: typeof taskStatuses[number];
  } = {}
) {
  const dueDate = faker.date.between({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const status = options.status || randomElement([...taskStatuses]);

  const taskData = options.title ? { title: options.title, description: options.description } : generateTaskData();

  const linkedTo = options.projectId
    ? { entityType: 'project' as const, entityId: options.projectId }
    : options.contactId
    ? { entityType: 'contact' as const, entityId: options.contactId }
    : undefined;

  return {
    _id: new mongoose.Types.ObjectId(),
    title: taskData.title,
    description: taskData.description,
    status,
    priorityId: priorityIds.length > 0 ? randomElement(priorityIds) : undefined,
    dueDate,
    linkedTo,
    assigneeId: ownerId,
    ownerId: ownerId,
    createdAt: faker.date.between({ from: '2023-06-01', to: new Date() }),
    updatedAt: new Date(),
  };
}

// ==================== MAIN ====================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('  UNIFIED SEED - Realistic CRM Data Generation');
  console.log('='.repeat(70));
  console.log(`\n  Mode: ${MODE.toUpperCase()}`);
  console.log(`  Contacts: ${CONTACT_COUNT.toLocaleString()}`);
  console.log(`  Batch size: ${BATCH_SIZE.toLocaleString()}`);
  console.log();

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const startTime = Date.now();

  // Connect to MongoDB
  console.log('1. Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;
  console.log('   Connected\n');

  // Clear existing data
  console.log('2. Clearing existing data...');
  const collections = [
    'users', 'contacts', 'opportunities', 'interactions',
    'pipelines', 'pipelinestages', 'channels',
    'dictionaries', 'dictionaryitems', 'projects', 'tasks',
    'system_settings'
  ];
  for (const coll of collections) {
    try {
      await db.collection(coll).deleteMany({});
    } catch {
      // Collection might not exist
    }
  }
  console.log('   Cleared\n');

  // Create admin user
  console.log('3. Creating admin user...');
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash('123456', 10);
  const adminUser = await User.create({
    name: 'Admin User',
    email: '5901867@gmail.com',
    passwordHash,
    roles: ['admin'],
    isActive: true,
  });
  const adminId = adminUser._id as mongoose.Types.ObjectId;
  console.log(`   Created: ${adminUser.email}`);

  // Create manager users
  console.log('\n4. Creating managers...');
  const managerIds: mongoose.Types.ObjectId[] = [adminId];

  for (const manager of MANAGERS_DATA) {
    const managerUser = await User.create({
      name: manager.name,
      email: manager.email,
      passwordHash,
      roles: ['manager'],
      isActive: true,
    });
    managerIds.push(managerUser._id as mongoose.Types.ObjectId);
    console.log(`   + ${manager.name} (${manager.email})`);
  }
  console.log(`   Created ${MANAGERS_DATA.length} managers\n`);

  // Create system settings with OpenAI integration
  console.log('5. Creating system settings with AI integration...');
  await SystemSettings.create({
    currency: 'USD',
    currencySymbol: '$',
    currencyPosition: 'before',
    ai: {
      activeProvider: 'openai',
      providers: {
        openai: {
          enabled: true,
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4o-mini',
        },
        anthropic: {
          enabled: false,
          model: 'claude-3-5-sonnet-latest',
        },
        google: {
          enabled: false,
          model: 'gemini-2.0-flash',
        },
      },
    },
    updatedBy: adminId,
  });
  console.log('   + OpenAI (gpt-4o-mini) configured as active provider\n');

  // Create dictionaries
  console.log('6. Creating dictionaries...');
  const dictIds: DictItemIds = {
    contactTypes: new Map(),
    sources: new Map(),
    industries: [],
    opportunityPriorities: [],
    taskPriorities: [],
  };

  for (const dictData of DICTIONARIES) {
    const { items, ...dictionaryInfo } = dictData;

    const dictionary = await Dictionary.create(dictionaryInfo);
    console.log(`   + ${dictData.name}`);

    for (const item of items) {
      if ('children' in item && item.children) {
        const parent = await DictionaryItem.create({
          dictionaryCode: dictionary.code,
          name: item.name,
        });

        if (dictData.code === 'industries') {
          dictIds.industries.push(parent._id as mongoose.Types.ObjectId);
        }

        for (const childName of item.children) {
          const child = await DictionaryItem.create({
            dictionaryCode: dictionary.code,
            name: childName,
            parentId: parent._id,
          });
          if (dictData.code === 'industries') {
            dictIds.industries.push(child._id as mongoose.Types.ObjectId);
          }
        }
      } else {
        const created = await DictionaryItem.create({
          dictionaryCode: dictionary.code,
          ...item,
        });

        const itemId = created._id as mongoose.Types.ObjectId;

        if (dictData.code === 'contact_types' && 'code' in item) {
          dictIds.contactTypes.set(item.code!, itemId);
        } else if (dictData.code === 'sources' && 'code' in item) {
          dictIds.sources.set(item.code!, itemId);
        } else if (dictData.code === 'opportunity_priority') {
          dictIds.opportunityPriorities.push(itemId);
        } else if (dictData.code === 'task_priority') {
          dictIds.taskPriorities.push(itemId);
        }
      }
    }
  }
  console.log();

  // Create channels
  console.log('7. Creating channels...');
  const channelIds: mongoose.Types.ObjectId[] = [];
  let smsChannelId: mongoose.Types.ObjectId | null = null;

  for (const ch of CHANNELS_DATA) {
    const created = await Channel.create(ch);
    channelIds.push(created._id as mongoose.Types.ObjectId);
    if (ch.code === 'sms') {
      smsChannelId = created._id as mongoose.Types.ObjectId;
    }
  }
  console.log(`   Created ${channelIds.length} channels\n`);

  // Create pipelines and stages
  console.log('8. Creating pipelines...');
  const allStages: StageInfo[] = [];

  for (const pData of PIPELINES_DATA) {
    const { stages, ...pipelineInfo } = pData;
    const pipeline = await Pipeline.create(pipelineInfo);

    for (let i = 0; i < stages.length; i++) {
      const stage = await PipelineStage.create({
        pipelineId: pipeline._id,
        ...stages[i],
        order: i,
      });
      allStages.push({
        id: stage._id as mongoose.Types.ObjectId,
        pipelineId: pipeline._id as mongoose.Types.ObjectId,
        pipelineCode: pData.code,
        stageIndex: i,
      });
    }
    console.log(`   + ${pData.name} (${stages.length} stages)`);
  }
  console.log();

  // Generate and insert contacts
  console.log('9. Generating contacts...');
  const contactData: { id: mongoose.Types.ObjectId; name: string; company?: string }[] = [];
  let contactsInserted = 0;

  for (let batch = 0; batch < CONTACT_COUNT; batch += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, CONTACT_COUNT - batch);
    const docs = [];

    for (let i = 0; i < batchSize; i++) {
      const ownerId = randomElement(managerIds);
      const doc = generateContactDoc(ownerId, dictIds);
      contactData.push({ id: doc._id, name: doc.name, company: doc.company });
      docs.push(doc);
    }

    await Contact.insertMany(docs, { ordered: false });
    contactsInserted += batchSize;
    progressBar(contactsInserted, CONTACT_COUNT, 'Contacts    ');
  }
  console.log('\n');

  // Generate and insert opportunities
  console.log('10. Generating opportunities...');
  const opportunityIds: mongoose.Types.ObjectId[] = [];
  let opportunitiesInserted = 0;

  const opportunitiesToCreate: ReturnType<typeof generateOpportunityDoc>[] = [];

  for (const contact of contactData) {
    const rand = Math.random();
    let oppCount = 0;

    if (rand < 0.10) {
      oppCount = 0; // 10% - no opportunities
    } else if (rand < 0.45) {
      oppCount = 1; // 35%
    } else if (rand < 0.75) {
      oppCount = 2; // 30%
    } else if (rand < 0.90) {
      oppCount = 3; // 15%
    } else {
      oppCount = faker.number.int({ min: 4, max: COUNTS.opportunitiesPerContact.max }); // 10%
    }

    for (let i = 0; i < oppCount; i++) {
      const ownerId = randomElement(managerIds);
      opportunitiesToCreate.push(
        generateOpportunityDoc(contact.id, contact.company, dictIds.opportunityPriorities, allStages, ownerId)
      );
    }
  }

  const totalOpportunities = opportunitiesToCreate.length;
  console.log(`   Preparing ${totalOpportunities.toLocaleString()} opportunities...`);

  for (let batch = 0; batch < totalOpportunities; batch += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, totalOpportunities - batch);
    const docs = opportunitiesToCreate.slice(batch, batch + batchSize);

    for (const doc of docs) {
      opportunityIds.push(doc._id);
    }

    await Opportunity.insertMany(docs, { ordered: false });
    opportunitiesInserted += batchSize;
    progressBar(opportunitiesInserted, totalOpportunities, 'Opportunities');
  }
  console.log('\n');

  // Generate interactions
  console.log('11. Generating interactions...');
  const interactionsCount = Math.floor(CONTACT_COUNT * 2.5);
  let interactionsInserted = 0;

  for (let batch = 0; batch < interactionsCount; batch += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, interactionsCount - batch);
    const docs = [];

    for (let i = 0; i < batchSize; i++) {
      const contact = randomElement(contactData);
      const createdBy = randomElement(managerIds);
      docs.push(generateInteractionDoc(contact.id, contact.name, channelIds, opportunityIds, createdBy));
    }

    await Interaction.insertMany(docs, { ordered: false });
    interactionsInserted += batchSize;
    progressBar(interactionsInserted, interactionsCount, 'Interactions');
  }
  console.log('\n');

  // Create projects
  console.log('12. Creating projects...');
  const projectIds: mongoose.Types.ObjectId[] = [];

  const projectsToCreate = isExtreme
    ? [...PROJECTS_DATA, ...Array(COUNTS.projects - PROJECTS_DATA.length).fill(null).map((_, i) => ({
        name: `Project ${i + 6}`,
        description: faker.lorem.sentence(),
        status: randomElement(['active', 'on_hold', 'completed']) as 'active' | 'on_hold' | 'completed',
        daysOffset: faker.number.int({ min: -30, max: 120 }),
      }))]
    : PROJECTS_DATA;

  for (const pData of projectsToCreate) {
    const ownerId = randomElement(managerIds);
    const project = await Project.create({
      name: pData.name,
      description: pData.description,
      status: pData.status,
      deadline: new Date(Date.now() + pData.daysOffset * 24 * 60 * 60 * 1000),
      ownerId,
    });
    projectIds.push(project._id as mongoose.Types.ObjectId);
    console.log(`   + ${pData.name}`);
  }
  console.log();

  // Create tasks
  console.log('13. Creating tasks...');
  let tasksCreated = 0;

  // Tasks for projects
  const projectTaskDocs = [];
  for (const projectId of projectIds) {
    for (let i = 0; i < COUNTS.tasksPerProject; i++) {
      const status = i < 3 ? 'completed' : i < 5 ? 'in_progress' : 'open';
      const assigneeId = randomElement(managerIds);
      const taskData = generateTaskData();
      projectTaskDocs.push(generateTaskDoc(assigneeId, dictIds.taskPriorities, {
        projectId,
        title: taskData.title,
        description: taskData.description,
        status: status as typeof taskStatuses[number],
      }));
    }
  }

  if (projectTaskDocs.length > 0) {
    await Task.insertMany(projectTaskDocs, { ordered: false });
    tasksCreated += projectTaskDocs.length;
  }
  console.log(`   Created ${tasksCreated} project tasks`);

  // Standalone tasks
  const standaloneDocs = [];
  for (let i = 0; i < COUNTS.standaloneTasks; i++) {
    const assigneeId = randomElement(managerIds);
    standaloneDocs.push(generateTaskDoc(assigneeId, dictIds.taskPriorities));
  }

  if (standaloneDocs.length > 0) {
    await Task.insertMany(standaloneDocs, { ordered: false });
    tasksCreated += standaloneDocs.length;
  }
  console.log(`   Created ${COUNTS.standaloneTasks} standalone tasks`);

  // Tasks linked to contacts
  const contactTaskDocs = [];
  const contactsForTasks = contactData.slice(0, COUNTS.contactTasksCount);
  for (const contact of contactsForTasks) {
    const taskCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < taskCount; i++) {
      const assigneeId = randomElement(managerIds);
      contactTaskDocs.push(generateTaskDoc(assigneeId, dictIds.taskPriorities, { contactId: contact.id }));
    }
  }

  if (contactTaskDocs.length > 0) {
    await Task.insertMany(contactTaskDocs, { ordered: false });
    tasksCreated += contactTaskDocs.length;
  }
  console.log(`   Created ${contactTaskDocs.length} contact tasks`);
  console.log();

  // Create test contact with SMS conversation
  console.log('14. Creating test contact with SMS conversation...');
  const testContact = await Contact.create({
    name: 'James Wilson',
    emails: [{ address: 'j.wilson@techcorp.com', isVerified: true, isSubscribed: true }],
    phones: [{ e164: '+14155551234', international: '+1 415 555-1234', country: 'US', type: 'MOBILE', isPrimary: true }],
    company: 'TechCorp Industries',
    position: 'VP of Sales',
    notes: 'Met at SaaS North conference. Very interested in enterprise solution. Has budget authority up to $500k.',
    ownerId: adminId,
  });

  if (smsChannelId) {
    const smsConversation = [
      { direction: 'inbound', content: "Hi! I saw your presentation at the conference and I'm very interested in your CRM platform.", minutesAgo: 180 },
      { direction: 'outbound', content: "Hi James! Great to hear from you. I'd be happy to set up a demo for your team. What challenges are you looking to solve?", minutesAgo: 175, status: 'read' },
      { direction: 'inbound', content: 'We need better pipeline visibility and forecasting. Currently using spreadsheets and its a mess.', minutesAgo: 170 },
      { direction: 'outbound', content: "That's a common pain point we solve. Our analytics dashboard provides real-time pipeline insights. How large is your sales team?", minutesAgo: 165, status: 'read' },
      { direction: 'inbound', content: '25 reps across 3 regions. Looking to expand to 40 by end of year.', minutesAgo: 160 },
      { direction: 'outbound', content: 'Perfect fit for our Enterprise plan. Includes multi-region support and advanced analytics. Want to schedule a demo this week?', minutesAgo: 155, status: 'read' },
      { direction: 'inbound', content: 'Thursday afternoon works. Can you include my VP of Ops and CTO? They need to see the integration capabilities.', minutesAgo: 150 },
      { direction: 'outbound', content: 'Absolutely! Thursday 2pm PT works. I\'ll send a calendar invite and include our solutions architect for technical questions.', minutesAgo: 145, status: 'delivered' },
      { direction: 'inbound', content: 'Perfect. Also, do you have any case studies from similar-sized tech companies?', minutesAgo: 120 },
      { direction: 'outbound', content: "Yes! I'll send over our TechStart case study - they had similar needs and saw 40% improvement in forecast accuracy. Talk Thursday!", minutesAgo: 115, status: 'read' },
      { direction: 'inbound', content: 'Thanks! Looking forward to it.', minutesAgo: 110 },
    ];

    const smsDocs = smsConversation.map(msg => ({
      channelId: smsChannelId,
      contactId: testContact._id,
      direction: msg.direction,
      status: msg.status || (msg.direction === 'inbound' ? 'delivered' : 'sent'),
      content: msg.content,
      createdAt: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
      updatedAt: new Date(),
    }));

    await Interaction.insertMany(smsDocs);
    console.log(`   Created ${smsDocs.length} SMS messages for test contact`);
  }
  console.log();

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalDocs = contactsInserted + opportunitiesInserted + interactionsInserted + tasksCreated;

  console.log('='.repeat(70));
  console.log('  SEED COMPLETED');
  console.log('='.repeat(70));
  console.log(`\n  Created:`);
  console.log(`    - 1 admin + ${MANAGERS_DATA.length} managers`);
  console.log(`    - ${contactsInserted.toLocaleString()} contacts`);
  console.log(`    - ${opportunitiesInserted.toLocaleString()} opportunities`);
  console.log(`    - ${interactionsInserted.toLocaleString()} interactions`);
  console.log(`    - ${projectIds.length} projects`);
  console.log(`    - ${tasksCreated.toLocaleString()} tasks`);
  console.log(`    - ${CHANNELS_DATA.length} channels`);
  console.log(`    - ${DICTIONARIES.length} dictionaries`);
  console.log(`    - 1 system settings (with OpenAI)`);
  console.log(`\n  Pipelines:`);
  for (const p of PIPELINES_DATA) {
    console.log(`    - ${p.name}: ${p.stages.length} stages`);
  }
  console.log(`\n  Time elapsed: ${elapsed} seconds`);
  console.log(`  Insert rate: ~${Math.round(totalDocs / parseFloat(elapsed)).toLocaleString()} docs/sec`);
  console.log(`\n  Contact distribution:`);
  console.log(`    - 45% have 1 phone + 1 email (standard)`);
  console.log(`    - 20% have phone only`);
  console.log(`    - 10% have email only`);
  console.log(`    - 5% have neither (incomplete)`);
  console.log(`    - 20% have multiple phones/emails`);
  console.log(`\n  AI Integration:`);
  console.log(`    Active: OpenAI (gpt-4o-mini)`);
  console.log(`\n  Users (password: 123456):`);
  console.log(`    Admin: 5901867@gmail.com`);
  console.log(`    Managers:`);
  for (const m of MANAGERS_DATA) {
    console.log(`      - ${m.email}`);
  }
  console.log();

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
