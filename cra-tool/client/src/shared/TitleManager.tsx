import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Central document.title control — one place instead of a hook in every page.
const TITLES: [RegExp, string][] = [
  [/^\/$/,                 'CRA Comply — Compliance & Vulnerability Management'],
  [/^\/login/,             'Sign in · CRA Comply'],
  [/^\/signup/,            'Create account · CRA Comply'],
  [/^\/dashboard/,         'Workspace · CRA Comply'],
  [/^\/cra\/dashboard/,    'Compliance Dashboard · CRA Comply'],
  [/^\/products/,          'Products · CRA Comply'],
  [/^\/product\/new/,      'Add Product · CRA Comply'],
  [/^\/compliance/,        'Compliance Matrix · CRA Comply'],
  [/^\/requirements/,      'CRA Requirements · CRA Comply'],
  [/^\/settings/,          'Settings · CRA Comply'],
  [/^\/vm\/tickets\/new$/, 'Log Vulnerability · CRA Comply'],
  [/^\/vm\/tickets\/.+/,   'Ticket · CRA Comply'],
  [/^\/vm\/tickets$/,      'Ticket Queue · CRA Comply'],
  [/^\/vm\/advisories/,    'Security Advisories · CRA Comply'],
  [/^\/vm$/,               'Vulnerability Management · CRA Comply'],
];

export default function TitleManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const match = TITLES.find(([re]) => re.test(pathname));
    document.title = match ? match[1] : 'CRA Comply';
  }, [pathname]);
  return null;
}
