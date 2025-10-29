import React from 'react';

export const HomeIcon = (props: React.SVGProps<SVGSVGElement> & { isFilled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill={props.isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

export const PrayerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5.5 20a13.43 13.43 0 0 1 3-10.2c2.5-3.2 5-3.2 7.5 0a13.43 13.43 0 0 1 3 10.2H5.5z"></path><path d="M2 20h20"></path><path d="M15.5 9a1 1 0 0 0-1-1 1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1z"></path><path d="M12 2v2"></path></svg>
);

export const QuranIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
);

export const HadithIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);

export const AIIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9.305 2.251a.75.75 0 01.655.918l-1.87 6.36a.75.75 0 001.23.69l4.49-3.232a.75.75 0 01.98.98l-3.232 4.49a.75.75 0 00.69 1.23l6.36-1.87a.75.75 0 01.918.655l.293 1.01a.75.75 0 01-.39 1.002l-5.05 2.02a.75.75 0 01-.93-.93l2.02-5.05a.75.75 0 00-1.002-.39l-1.01.293a.75.75 0 01-.655-.918l1.87-6.36a.75.75 0 00-1.23-.69l-4.49 3.232a.75.75 0 01-.98-.98l3.232-4.49a.75.75 0 00-.69-1.23l-6.36 1.87a.75.75 0 01-.918-.655l-.293-1.01a.75.75 0 01.39-1.002l5.05-2.02a.75.75 0 01.93.93l-2.02 5.05a.75.75 0 001.002.39l1.01-.293zM5.25 15.75a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75v-.01zM4.5 19.5a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75H4.5zM8.25 19.5a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75H8.25zM15.75 5.25a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.01a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75v-.01zM19.5 4.5a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75H19.5zM19.5 8.25a.75.75 0 00-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 00.75-.75v-.01a.75.75 0 00-.75-.75H19.5z" clipRule="evenodd" />
    </svg>
);