import React from 'react';

export const HomeIcon = (props: React.SVGProps<SVGSVGElement> & { isFilled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill={props.isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

export const PrayerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5.5 20a13.43 13.43 0 0 1 3-10.2c2.5-3.2 5-3.2 7.5 0a13.43 13.43 0 0 1 3 10.2H5.5z"></path><path d="M2 20h20"></path><path d="M15.5 9a1 1 0 0 0-1-1 1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1z"></path><path d="M12 2v2"></path></svg>
);

export const QuranIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
);

export const HadithIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);

export const AIIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM13 14.5l-1-2-2-1 2-1 1-2 1 2 2 1-2 1-1 2zM16.5 8.5l-.5-1-1-.5 1-.5.5-1 .5 1 1 .5-1 .5-.5 1z" />
    </svg>
);


export const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

export const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
    </svg>
);

export const AudioWaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4.5 12a.75.75 0 00.75.75h.75a.75.75 0 000-1.5H5.25a.75.75 0 00-.75.75zM8.25 12a.75.75 0 00.75.75H9.75v-.012a.75.75 0 00-1.5 0v.012H9a.75.75 0 00-.75-.75zM12 11.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM15.75 12a.75.75 0 00.75.75h.75a.75.75 0 000-1.5h-.75a.75.75 0 00-.75.75zM18.75 12a.75.75 0 00.75.75h.75a.75.75 0 000-1.5h-.75a.75.75 0 00-.75.75z" />
    </svg>
);