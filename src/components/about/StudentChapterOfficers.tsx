// Written by Evan Dan

import Image from 'next/image';

type Officer = {
  name: string;
  role: string;
  image: string;
  bio: string;
};

type ParentAdvisor = {
  name: string;
  company: string;
  title: string;
  image: string;
  bio?: string;
  adviceQuestion?: string;
  adviceAnswer?: string;
};

const STUDENT_OFFICERS: Officer[] = [
  {
    name: 'Evan Dan',
    role: 'President',
    image: '/evan.jpg',
    bio: 'Evan is a senior interested in data science. Evan has conducted research at Kent State University over the past 3 years, where he has used AI and Natural Language Processing to analyze text. He aims to help expand this initiative in order to help as many high school students gain exposure and hands-on experience into the real professional STEM world.',
  },
  {
    name: 'Iris Li',
    role: 'Vice President',
    image: '/iris.jpg',
    bio: 'Iris is a junior interested in electrical engineering. She is a part of Future Problem Solvers, Girls Who Code, and likes to dance. In her free time, she enjoys doing puzzles and listening to music. She is excited to learn more about different engineering fields and getting the chance to interact with professionals!',
  },
  {
    name: 'Manning Lu',
    role: 'Secretary',
    image: '/manning.jpg',
    bio: 'Manning is a sophomore interested in software engineering. He does Science Olympiad and also cross country and track. He looks forward to learning more in depth how the industry works and trying to help CES grow more with the Solon School District.',
  },
  {
    name: 'Michael J Parker',
    role: 'Community Chair',
    image: '/michael.jpg',
    bio: 'Michael is a junior interested in pursuing a career in medicine or chemical engineering. In his free time he likes to read, run, and watch movies. He hopes to learn more about the engineering workforce and how engineering works in general.',
  },
];

const PARENT_ADVISORS: ParentAdvisor[] = [
  {
    name: 'Tao Zhang',
    company: 'Aclara Technologies',
    title: 'Senior Quality Engineer',
    image: '/tao.jpg',
    bio: 'As an advisor of the CES Student Chapter, I hope to inspire them to explore different areas of engineering and be there to guide them whenever they face challenges. My goal is to help them grow with confidence, curiosity, and a strong passion for engineering. I also aim to serve as a strong bridge between CES and the students—helping connect them with resources, opportunities, and industry perspectives.',
    adviceQuestion:
      'What advice do you have for the student members of the CES student chapter?',
    adviceAnswer: 'Stay curious and seek out every chance to get hands on experience.',
  },
  {
    name: 'Lily Liang',
    company: 'Supply Technologies',
    title: 'Director of Quality',
    image: '/lily.jpg',
  },
];

function RoleBadge({ label }: { label: string }) {
  return (
    <span className="inline-block mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#00539eff] bg-[#00539eff]/10 rounded">
      {label}
    </span>
  );
}

function OfficerCard({ officer }: { officer: Officer }) {
  return (
    <article className="flex flex-col sm:flex-row gap-5 p-6 bg-white border border-gray-200 rounded-lg">
      <div className="relative w-full sm:w-36 h-44 sm:h-36 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={officer.image}
          alt={officer.name}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 144px"
        />
      </div>
      <div className="min-w-0">
        <h4 className="text-xl font-semibold text-gray-900">{officer.name}</h4>
        <RoleBadge label={officer.role} />
        <p className="mt-4 text-gray-700 leading-relaxed">{officer.bio}</p>
      </div>
    </article>
  );
}

function ParentAdvisorCard({ advisor }: { advisor: ParentAdvisor }) {
  return (
    <article className="flex flex-col sm:flex-row gap-5 p-6 bg-white border border-gray-200 rounded-lg">
      <div className="relative w-full sm:w-36 h-44 sm:h-36 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={advisor.image}
          alt={advisor.name}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, 144px"
        />
      </div>
      <div className="min-w-0">
        <h4 className="text-xl font-semibold text-gray-900">{advisor.name}</h4>
        <p className="mt-1 text-gray-800 font-medium">{advisor.company}</p>
        <p className="text-gray-600 italic">{advisor.title}</p>
        <RoleBadge label="Parent Advisor" />
        {advisor.bio && (
          <p className="mt-4 text-gray-700 leading-relaxed">{advisor.bio}</p>
        )}
        {advisor.adviceQuestion && advisor.adviceAnswer && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{advisor.adviceQuestion}</p>
            <p className="mt-2 text-gray-700 leading-relaxed">{advisor.adviceAnswer}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function StudentChapterOfficers() {
  return (
    <section className="w-full bg-gray-50 py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-5">
        <h2 className="text-[#00539eff] text-3xl md:text-4xl font-bold mb-2">
          Solon High School Student Chapter
        </h2>

        <div className="mt-10">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Student Officers</h3>
          <div className="grid grid-cols-1 gap-6">
            {STUDENT_OFFICERS.map((officer) => (
              <OfficerCard key={officer.name} officer={officer} />
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Parent Advisors</h3>
          <div className="grid grid-cols-1 gap-6">
            {PARENT_ADVISORS.map((advisor) => (
              <ParentAdvisorCard key={advisor.name} advisor={advisor} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
