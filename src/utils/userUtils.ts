const USER_KEY = 'counter-app-user-name';
const GUEST_PREFIX = 'Guest';

export const generateGuestName = (): string => {
  const randomId = Math.floor(Math.random() * 9999) + 1;
  return `${GUEST_PREFIX}${randomId}`;
};

export const getUserName = (): string => {
  let userName = localStorage.getItem(USER_KEY);
  
  if (!userName) {
    userName = generateGuestName();
    localStorage.setItem(USER_KEY, userName);
  }
  
  return userName;
};

export const setUserName = (name: string): void => {
  localStorage.setItem(USER_KEY, name);
};