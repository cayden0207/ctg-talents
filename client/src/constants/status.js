export const STATUS_FLOW = {
  NEW: ['INTERVIEWING', 'READY', 'TERMINATED'],
  INTERVIEWING: ['READY', 'TERMINATED'],
  READY: ['PENDING_ACCEPTANCE', 'RETURNED'],
  PENDING_ACCEPTANCE: ['ONBOARDING', 'READY'],
  ONBOARDING: ['PROBATION', 'RETURNED'],
  PROBATION: ['CONFIRMED', 'PIP', 'RESIGNED', 'TERMINATED'],
  CONFIRMED: ['PIP', 'RESIGNED', 'RETURNED'],
  PIP: ['CONFIRMED', 'TERMINATED', 'RESIGNED'],
  RETURNED: ['READY', 'PENDING_ACCEPTANCE'],
  RESIGNED: [],
  TERMINATED: [],
};

export const ALL_STATUSES = Object.keys(STATUS_FLOW);
export const JV_MUTABLE_STATUSES = ['ONBOARDING', 'PROBATION', 'CONFIRMED', 'PIP', 'RESIGNED', 'RETURNED'];

export const statusLabel = (status) => {
  const labels = {
    NEW: 'New',
    INTERVIEWING: 'Interviewing',
    READY: 'Ready for Allocation',
    PENDING_ACCEPTANCE: 'Pending Acceptance',
    ONBOARDING: 'Onboarding',
    PROBATION: 'Probation',
    CONFIRMED: 'Confirmed',
    PIP: 'PIP',
    RESIGNED: 'Resigned',
    TERMINATED: 'Terminated',
    RETURNED: 'Returned to Pool',
  };
  return labels[status] || status;
};

export const getNextStatuses = (status) => STATUS_FLOW[status] || [];
