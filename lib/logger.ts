import { DEBUG_MODE } from '@/_CONFIG/app.config.json';


const ANSI_COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',

  info: '\x1b[34m', // blue
  error: '\x1b[31m', // red
  warning: '\x1b[33m', // yellow
  success: '\x1b[32m', // green
};

type LOGGER_ARGS = {
  type: 'info' | 'error' | 'warning' | 'success';
  message?: string;
  print?: any;
};

export const _LOGGER = ({ type = 'info', message, print }: LOGGER_ARGS) => {
  // Errors and warnings are always logged; requests, responses and notes only in debug mode.
  if (!DEBUG_MODE && (type === 'info' || type === 'success')) return;
  console.log(
    `${ANSI_COLORS[type]}-------------- --- --- -- - - -- - - ---- - --- - --  - - - - -- ---  - - -   -  -${ANSI_COLORS.reset}`
  );
  console.log(`${ANSI_COLORS[type]}${message}${ANSI_COLORS.reset}`, print ?? '');
  console.log(
    `${ANSI_COLORS[type]}-------------- --- --- -- - - -- - - ---- - --- - --  - - - - -- ---  - - -   -  -${ANSI_COLORS.reset}`
  );
};
