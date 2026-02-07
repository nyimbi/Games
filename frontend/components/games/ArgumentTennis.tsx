'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Trophy, ChevronRight, RotateCcw,
  ArrowLeft, ThumbsUp, ThumbsDown, Lightbulb, Loader2, Sparkles,
} from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { GameLayout } from './GameLayout';
import { useSounds } from '@/lib/hooks/useSounds';
import { updatePlayerStats, checkAchievements } from '@/lib/games/achievements';
import { useAchievementToast } from '@/components/ui/AchievementToast';

interface ArgumentTennisProps {
  onExit?: () => void;
}

type Phase = 'intro' | 'select_topic' | 'playing' | 'ai_thinking' | 'ai_response' | 'result';

interface DebateRound {
  label: string;
  playerPrompt: string;
  aiResponse: string; // fallback if API unavailable
}

interface DebateTopic {
  id: string;
  topic: string;
  context: string;
  aiOpening: string;
  forRounds: DebateRound[];
  againstRounds: DebateRound[];
}

interface ExchangeRecord {
  player: string;
  ai: string;
  scores: number[];
  label: string;
  feedback: string;
}

const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'dt1',
    topic: 'Social media does more harm than good for young people',
    context: 'Over 95% of teens use social media. Mental health concerns are rising, but so is global connectivity.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Present your strongest opening argument for why social media harms young people. Include at least one specific piece of evidence.', aiResponse: 'An interesting opening, but you are overlooking a key reality: social media is the primary way isolated young people find communities of support. LGBTQ+ teens in unsupportive areas, kids with rare medical conditions, and those in rural communities all depend on these connections. Loneliness is a far greater health risk than screen time.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues social media helps isolated youth find community. Counter this point directly — why is that benefit outweighed by the harm?', aiResponse: 'You raise valid concerns about mental health, but consider this: the largest study on teen social media use (Oxford, 2019) found the effect on well-being was comparable to wearing glasses or eating potatoes. Meanwhile, digital literacy is now an essential job skill — denying young people access puts them at a competitive disadvantage.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI cited the Oxford study minimizing harm. Present your strongest evidence — specific studies, statistics, or real-world examples that support your side.', aiResponse: 'Those statistics are concerning, but correlation is not causation. The same period saw increases in academic pressure, climate anxiety, and pandemic effects. Blaming social media alone ignores these confounding factors. Moreover, youth-led movements like March for Our Lives were organized entirely through social media — should we deny young people these powerful tools for civic engagement?' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues correlation is not causation and points to civic engagement benefits. Acknowledge any valid points, then explain why your position is still stronger overall.', aiResponse: 'I appreciate you engaging with the nuance. But consider that banning or restricting social media has been tried — and it consistently fails while pushing usage underground where there are no safety features at all. The real solution is teaching digital citizenship, not prohibition.' },
      { label: 'Closing Argument', playerPrompt: 'This is your final statement. Summarize your strongest points, address the AI\'s best argument, and end with a compelling conclusion.', aiResponse: 'A strong debate! However, your position ultimately requires removing a technology that billions use for genuine benefit to address problems that have multiple causes. The more proportionate response is better platform design, stronger regulations, and comprehensive digital literacy education. Thank you for a thoughtful exchange.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Present your strongest opening argument for why social media is beneficial for young people. Include specific evidence or examples.', aiResponse: 'While community sounds nice, the data tells a darker story. Internal Facebook research leaked in 2021 showed Instagram makes body image issues worse for 1 in 3 teen girls — and they knew it. Cyberbullying has increased 87% since 2016. These platforms are not neutral tools; they are designed to exploit adolescent psychology for profit.' },
      { label: 'Rebuttal', playerPrompt: 'The AI cited Facebook\'s own research on harm to teen girls. Counter this — why do the benefits still outweigh this kind of evidence?', aiResponse: 'You make fair points about learning and connection, but you are ignoring the addictive design problem. Infinite scrolling, autoplay, and notification systems are engineered to exploit dopamine pathways. Adults struggle with these — expecting children whose prefrontal cortexes are still developing to self-regulate is unrealistic.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI focuses on addictive design features. Present specific evidence — studies, examples, or data — showing that social media\'s benefits are substantial and measurable.', aiResponse: 'Those benefits exist, but at what cost? Screen time from social media now averages 4.8 hours daily for teens, displacing sleep, physical activity, and face-to-face interaction. The American Psychological Association has formally warned that social media poses a "profound risk" to children.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI cited the APA warning and time displacement effects. Acknowledge any valid points in their argument, then explain why your position remains stronger.', aiResponse: 'You raise good points about adaptation, but there is a critical difference between this technology and previous ones: social media is designed by thousands of engineers to be maximally addictive, targeting the most vulnerable developmental period. Books and TV never had that level of psychological engineering aimed specifically at children.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Summarize your case for social media\'s net benefit, address the AI\'s most compelling point, and end with a strong conclusion.', aiResponse: 'A thoughtful debate! Your argument has merit — social media does offer genuine benefits. But the weight of evidence from internal research, psychological associations, and measurable health outcomes suggests the scales tip toward harm as currently designed. Thank you for the exchange.' },
    ],
  },
  {
    id: 'dt2',
    topic: 'Space exploration funding should be redirected to solving Earth problems',
    context: 'NASA\'s budget is ~$25 billion/year (0.5% of US federal spending). Global challenges include climate change, poverty, and disease.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue why space funding should go to Earth problems instead. Open with your most compelling point and specific evidence.', aiResponse: 'A passionate opening, but consider this: space research gave us water purification systems now used in developing countries, satellite weather monitoring that saves thousands of lives annually, and GPS that underpins global logistics. The $7 return per dollar spent on NASA is documented. Cutting space funding does not solve Earth problems — it removes one of our best tools for solving them.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues space research creates technology that helps Earth. Counter this — why is direct investment in Earth problems more effective?', aiResponse: 'Direct investment sounds logical, but the track record says otherwise. We already spend $200+ billion on foreign aid annually with mixed results. The problem with Earth\'s challenges is rarely funding alone — it is political will, corruption, and logistics. Meanwhile, asteroid detection could literally save all life on Earth.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI brings up asteroid threats and argues more aid money alone will not solve problems. Present your strongest evidence for why redirection would work better.', aiResponse: 'Your examples of underfunding are real, but they actually support diversified investment, not concentration. Climate monitoring satellites — funded by space agencies — provide the data that makes effective environmental policy possible. Cutting the space budget would save 0.5% of federal spending while destroying capabilities we cannot rebuild.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues space is only 0.5% of the budget and cutting it is symbolic, not impactful. Acknowledge what is valid, then strengthen your position.', aiResponse: 'I appreciate you grappling with the scale argument. But consider the inspiration factor: space programs drive STEM enrollment, which creates the engineers, doctors, and scientists who solve Earth problems. Countries that cut space programs did not redirect savings effectively — they just lost the pipeline of innovation.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why should space money go to Earth problems? Summarize, address the AI\'s best point, and close strong.', aiResponse: 'An engaging debate! Your moral argument is compelling — the urgency of suffering demands attention. But the false choice between space and Earth problems weakens your case. History shows that exploration and problem-solving are not competing priorities; they are the same human drive expressed differently. Thank you for making me think.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue why space exploration funding should be maintained. Open with your most compelling evidence for its value.', aiResponse: 'Impressive technology list, but here is the uncomfortable truth: while we celebrate Mars rovers, 828 million people went hungry last year. The WHO estimates $13 billion could eliminate malaria. That is half of NASA\'s budget. We are choosing to look at stars while people die from preventable causes.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues we cannot morally justify space spending while people die from preventable causes. Counter this directly.', aiResponse: 'That defense of parallel investment sounds reasonable until you examine budgets. Most Earth-focused programs are chronically underfunded. Saying "we can do both" is a convenient dodge when "both" means one gets $25 billion and the other gets scraps. Priorities require choices.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI says "we can do both" is a dodge given real-world budget constraints. Present your strongest evidence for space exploration\'s unique, irreplaceable value.', aiResponse: 'Asteroid defense is a valid point, but it requires a fraction of current space budgets. Most space funding goes to projects with no defensive purpose — Mars colonization, deep space probes, space tourism subsidies. We can maintain a planetary defense program at 10% of current spending.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues only planetary defense justifies the cost and the rest is luxury. Acknowledge any valid points, then explain why broad space investment is still worthwhile.', aiResponse: 'Innovation arguments have some merit, but they assume space is the only way to drive that innovation. Targeted R&D in clean energy, medical technology, and food science would generate equal or greater returns while directly solving the problems we are discussing.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Defend space exploration funding. Summarize your case, address the AI\'s strongest point, and end compellingly.', aiResponse: 'A well-argued defense! You are right that space investment produces real returns. My concern remains the opportunity cost — every dollar has infinite possible uses, and directing resources to their highest human impact matters. Thank you for the stimulating exchange.' },
    ],
  },
  {
    id: 'dt3',
    topic: 'Homework should be abolished in schools',
    context: 'Average US student spends 6.8 hours/week on homework. Finland assigns minimal homework and ranks highly in education.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue for abolishing homework. Lead with your strongest reason and supporting evidence.', aiResponse: 'You cite Finland, but that comparison is misleading. Finland has smaller class sizes, higher teacher pay, and a fundamentally different culture. Removing homework without those supports would leave students with less practice, not more free time for learning.' },
      { label: 'Rebuttal', playerPrompt: 'The AI says the Finland comparison is misleading and that homework builds discipline. Counter this directly.', aiResponse: 'Those inequality concerns are real, but abolishing homework punishes students who benefit from it to protect students who need better support. The solution is homework reform — differentiated assignments, in-school study halls, and resource programs — not elimination.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI argues for homework reform rather than abolition. Present your strongest evidence that homework itself is the problem, not just its implementation.', aiResponse: 'Interesting research, but the meta-analyses show homework has significant positive effects for high school students. The "no benefit" finding only applies to elementary school. Are you arguing for abolition at all levels, or just younger grades?' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI distinguishes between age groups and argues the data only supports reducing homework for young students. Address this nuance.', aiResponse: 'Your argument about play and creativity is compelling for younger children. But for teenagers preparing for college and careers, independent practice is not optional — it is how expertise develops. Musicians practice, athletes train, and students study.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Make your best case for abolishing homework. Summarize, address the age-group argument, and close strong.', aiResponse: 'A nuanced debate! You have made me reconsider homework for younger students. But your case for abolition at all levels stretches beyond what the evidence supports. Perhaps the real conclusion is that homework needs a fundamental redesign. Thank you for pushing this important conversation.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue for keeping homework. Lead with your strongest evidence for its value.', aiResponse: 'Those skills matter, but at what cost? Research from Stanford found that 56% of students cited homework as a primary source of stress. Sleep deprivation from late-night homework is linked to lower grades — the opposite of what it intends.' },
      { label: 'Rebuttal', playerPrompt: 'The AI cites student stress and argues classroom activities could replace homework. Counter this directly.', aiResponse: 'More classroom time sounds ideal, but the average school day is already packed. Teachers report having insufficient time to cover required curricula. Adding practice time means cutting something else — arts, recess, or social-emotional learning.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI argues there is no room in the school day and that homework assumes equal home conditions. Present specific evidence for homework\'s measurable benefits.', aiResponse: 'Spaced repetition does work — but it does not require homework. Classroom-based spaced review, low-stakes quizzes, and project-based learning achieve the same retention benefits without the equity concerns.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI says spaced repetition can happen in class without homework. Acknowledge any valid points, then explain why homework still adds irreplaceable value.', aiResponse: 'Independent learning is important, but consider: if the goal is independence, why mandate specific tasks with deadlines? Self-directed reading and curiosity-driven projects develop more genuine independence than assigned worksheets.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Defend homework. Summarize your strongest arguments, address the independence paradox, and close compellingly.', aiResponse: 'Well debated! You have made a strong case for structured practice. I wonder if we actually agree more than we disagree — we both want effective learning and student wellbeing. Thank you for a thoughtful exchange.' },
    ],
  },
  {
    id: 'dt4',
    topic: 'Artificial intelligence will create more jobs than it destroys',
    context: 'AI is automating tasks across industries. Goldman Sachs estimates 300M jobs affected. New AI-related jobs are emerging rapidly.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that AI will be a net job creator. Lead with historical precedent or specific evidence.', aiResponse: 'Historical precedent is your strongest card, but there is a critical difference this time: previous revolutions automated physical labor, leaving cognitive work untouched. AI automates cognitive tasks — writing, analysis, coding, design. When both physical and mental labor can be automated, what remains for humans?' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues AI is different from previous revolutions because it automates cognitive work. Counter this directly with specific reasoning.', aiResponse: 'Augmentation is real for some workers, but consider who benefits. A study of GitHub Copilot showed it made experienced developers 55% faster — meaning companies need fewer developers for the same output. "Augmentation" for employers often means "headcount reduction."' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI argues productivity gains lead to headcount reduction, not more jobs. Present your strongest evidence for AI job creation.', aiResponse: 'New industries are emerging, true. But consider the math: the entire US AI industry employs roughly 300,000 people, while Goldman Sachs estimates 300 million jobs globally will be disrupted. That is a 1000:1 ratio. What specific industries will absorb hundreds of millions of displaced workers?' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI challenges you on the scale: 300K AI jobs vs 300M disrupted. Address this numbers gap and explain why the job creation will scale.', aiResponse: 'Your transition and retraining arguments are important, but history shows retraining programs have disappointing results. Only 37% of displaced workers who enter retraining programs find equivalent employment. Speed matters — AI adoption is faster than any previous technology shift.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why will AI create more jobs than it destroys? Address the scale and speed concerns, and close with conviction.', aiResponse: 'A stimulating debate! Your optimism about human adaptability is appealing. But the scale, speed, and cognitive nature of AI disruption deserve more caution than "it worked out last time." Perhaps the truth is that AI will create abundance — the question is whether we distribute it fairly. Thank you for engaging seriously.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that AI will destroy more jobs than it creates. Lead with your most compelling evidence.', aiResponse: 'Alarming statistics, but they describe disruption, not destruction. The ATM was supposed to eliminate bank tellers — instead, cheaper branches meant more branches, and the number of tellers actually grew for decades. AI changing job tasks is not the same as eliminating jobs.' },
      { label: 'Rebuttal', playerPrompt: 'The AI uses the ATM/bank teller example to argue disruption does not equal job loss. Counter this analogy.', aiResponse: 'That is a reasonable distinction, but consider the pace of change. The internet disrupted over 15 years; AI is disrupting in 2-3 years. Creative industries are already adapting — illustrators now use AI as a tool, not a replacement. Adaptation is painful but real.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI says adaptation happens and cites music industry survival. Present specific evidence of industries or workers AI is already permanently displacing.', aiResponse: 'Customer service and translation are real examples, but look deeper. Customer service roles were already declining from offshoring before AI. Translation has grown overall because AI translation created demand for more translated content. The visible displacement often masks a more complex reality.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues that demand increases alongside automation, offsetting job losses. Address this and explain why AI is different.', aiResponse: 'The speed concern is your strongest point. But the solution to inadequate transition support is better policy, not stopping innovation. Countries like Denmark invest heavily in "flexicurity" — flexible labor markets with strong safety nets. The problem is not AI itself but our failure to prepare for change.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why will AI destroy more jobs than it creates? Summarize your case, address the "fix policy not technology" argument, and close strong.', aiResponse: 'A powerful debate! Your concern for displaced workers is morally serious. The question may not be whether AI creates or destroys more jobs, but whether we manage the transition humanely. Thank you for a challenging exchange.' },
    ],
  },
  {
    id: 'dt5',
    topic: 'Zoos are essential for conservation',
    context: '1 million species face extinction. AZA zoos spend $230M+ annually on conservation. Critics argue captivity causes animal suffering.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that zoos are essential for conservation. Lead with your strongest evidence of their conservation impact.', aiResponse: 'Those success stories are real but cherry-picked. Of the roughly 8,700 species in zoos, fewer than 200 are part of serious breeding programs. The vast majority are kept primarily for entertainment. If conservation were truly the mission, most zoo budgets would go to field work.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues most zoo species are for entertainment, not conservation. Counter this by explaining why even non-endangered species in zoos serve conservation.', aiResponse: 'Education impact is the zoo industry\'s favorite claim, but a landmark study by Marino et al. found no consistent evidence that zoo visits increase conservation understanding or behavior. Many visitors leave with reinforced ideas that animals exist for human entertainment.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI cites research showing zoo visits do not actually improve conservation attitudes. Present your strongest counter-evidence.', aiResponse: 'Funding numbers are meaningful, but context matters. AZA zoos collectively spend $230 million on conservation while generating over $22 billion in revenue — that is roughly 1% back to conservation. The zoo model is an extraordinarily inefficient conservation vehicle.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues zoos spend only 1% of revenue on conservation. Acknowledge this and explain why zoos still provide irreplaceable value.', aiResponse: 'Genetic banking is genuinely valuable. But genetic material can be preserved without keeping living animals in captivity — frozen zoos and biobanks achieve this at a fraction of the cost and suffering.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why are zoos essential for conservation? Address the efficiency and animal welfare concerns, and close with your strongest point.', aiResponse: 'A thought-provoking debate! You have convinced me that some zoo conservation programs are genuinely irreplaceable. But "essential" is a strong word for institutions where conservation is demonstrably not the primary activity. Thank you for the exchange.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that zoos are NOT essential for conservation. Lead with your strongest point against the zoo model.', aiResponse: 'Animal welfare matters, but so does species survival. The California condor had 22 individuals left in 1987. Without zoo breeding programs, they would be extinct. The Arabian oryx, black-footed ferret, and golden lion tamarin tell similar stories. Captivity is imperfect, but extinction is permanent.' },
      { label: 'Rebuttal', playerPrompt: 'The AI cites condors, oryx, and ferrets saved by zoos. Counter this — why are these examples not sufficient to justify the entire zoo system?', aiResponse: 'That is a fair distinction — emergency programs versus the broader system. But those emergency programs exist because zoos invested decades in expertise, infrastructure, and genetic knowledge before the crises hit. You cannot spin up a condor breeding program overnight.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI argues everyday zoo operations build the expertise needed for emergency conservation. Present evidence that this capability could exist without traditional zoos.', aiResponse: 'Specialized facilities could work in theory, but who funds them? Zoos generate revenue from visitors, creating a self-sustaining conservation funding model. Pure research facilities depend on grants and donations — inherently unstable.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues visitor revenue is what funds conservation. Address this financial model argument and propose alternatives.', aiResponse: 'Those alternative funding models are theoretical, while zoo funding is proven and operational right now. Transitioning mid-extinction-crisis is an enormous gamble.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why are zoos not essential for conservation? Address the funding and transition-risk arguments, and close with conviction.', aiResponse: 'An excellent debate! You have made a compelling case for reimagining how we fund and conduct conservation. The animals at the center of this debate deserve us getting this right. Thank you for a thoughtful exchange.' },
    ],
  },
  {
    id: 'dt6',
    topic: 'School uniforms improve the learning environment',
    context: 'About 20% of US public schools require uniforms. Proponents cite equality; opponents cite self-expression. Research is mixed.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that school uniforms improve learning. Lead with your strongest reasoning and evidence.', aiResponse: 'Economic equality sounds compelling, but the reality is more complicated. Low-income families must now buy both uniforms AND casual clothes. A Long Beach Unified study found that while disciplinary incidents dropped initially, the effect faded within 3 years. Uniforms are a surface fix for deeper issues.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues uniforms are a surface fix and the cost burden falls on poor families. Counter these specific points.', aiResponse: 'Decision fatigue is an interesting argument, but it applies to adults making high-stakes choices, not children choosing outfits. More importantly, self-expression through clothing is a developmental need for adolescents. Suppressing it does not free mental energy; it creates resentment.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI argues self-expression through clothing is a developmental need. Present evidence that uniforms provide measurable academic or social benefits.', aiResponse: 'Schools that improve often implement uniforms alongside other reforms. Attributing improvement to uniforms specifically is a classic confounding variable problem. The most rigorous studies find no statistically significant academic effect from uniforms alone.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues research shows no academic effect when controlling for confounding variables. Address this methodological challenge.', aiResponse: 'School culture is indeed multifaceted. But that works against your argument too — if we cannot prove uniforms help, why mandate them? The burden of proof should fall on those restricting freedom, not those defending it.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why do uniforms improve learning? Address the burden-of-proof argument and close with your strongest case.', aiResponse: 'A well-argued debate! You have made a reasonable case that uniforms contribute to a positive school culture. Perhaps the answer is offering uniforms as an option rather than a mandate. Thank you for engaging thoughtfully.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue against school uniforms. Lead with your strongest point about why they harm the learning environment.', aiResponse: 'Self-expression matters, but school is not primarily about self-expression — it is about learning. Schools with uniforms report 44% fewer dress code incidents, freeing administrators to focus on education instead of policing hemlines and logos.' },
      { label: 'Rebuttal', playerPrompt: 'The AI says uniforms reduce dress code incidents and free up administrator time. Counter this specifically.', aiResponse: 'You raise an interesting point about eliminating dress codes entirely. But in practice, unregulated dress creates its own problems — inappropriate clothing, pressure to wear expensive brands, and gang-associated clothing in some communities. Some boundaries are necessary.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI says some clothing rules are necessary and uniforms are the simplest approach. Present evidence that non-uniform approaches work better.', aiResponse: 'Those success stories exist, but they often involve significant investment in community building and counselor time that many schools cannot afford. Uniforms achieve a baseline of visual equality with minimal ongoing cost.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI argues not all schools can afford comprehensive approaches and uniforms are simpler. Acknowledge this and explain why uniforms are still the wrong choice.', aiResponse: 'Resource constraints are real. But we should not let the perfect be the enemy of the good. Schools facing immediate problems need immediate, practical solutions. Uniforms may be imperfect, but they are implementable next semester while culture-building takes years.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why should schools not require uniforms? Address the practicality argument and close with your strongest case.', aiResponse: 'A strong debate! The core disagreement is about pragmatism versus principle. Both positions have merit, and the best answer likely depends on each school\'s context. Thank you for a great exchange.' },
    ],
  },
  {
    id: 'dt7',
    topic: 'Competitive sports do more harm than good for children',
    context: '45 million US children play organized sports. Youth sport injuries cost $30B+ annually. 70% of kids quit sports by age 13.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that competitive sports harm children more than they help. Lead with your most compelling evidence.', aiResponse: 'Injury and burnout statistics are concerning, but they describe problems with implementation, not competition itself. Properly coached, age-appropriate competition teaches resilience, teamwork, and goal-setting in ways no classroom can replicate.' },
      { label: 'Rebuttal', playerPrompt: 'The AI says the problems are about implementation, not competition itself. Counter this — why is the competitive model fundamentally the issue?', aiResponse: 'You make a valid point about structural pressure, but consider what happens without competition: recreational leagues with no score-keeping often see declining participation because kids actually want to compete. Removing competition does not remove the desire.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI argues children naturally want competition and removing it reduces engagement. Present evidence that non-competitive models produce better outcomes.', aiResponse: 'Scandinavian models show later specialization works, but those countries still have competitive sports — they just delay intensity. The argument against early intensity supports reforming timelines, not eliminating competition.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI says even Scandinavian models use competition, just later. Address this and make your case for why competition itself is harmful.', aiResponse: 'Your distinction between mastery and performance orientation is excellent coaching psychology. But research also shows that appropriate competitive challenge creates "flow states" that are optimal for learning and enjoyment. The problem is calibrating the challenge, not removing it.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why do competitive sports do more harm than good for children? Address the flow-state argument and close with conviction.', aiResponse: 'A nuanced and thoughtful debate! You have shifted my thinking on the pressure systems around youth sports. I think we agree competition can be harmful when poorly implemented and beneficial when done right. The children at the center of this debate deserve adults who care as much as you do. Thank you.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue that competitive sports are good for children. Lead with your strongest evidence of their benefits.', aiResponse: 'The benefits you describe are real, but consider who receives them. Youth sports increasingly favor wealthy families — travel teams cost $2,000-$5,000+ per season, excluding working-class children from the resilience and teamwork you praise.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues competitive sports are unequal and exclude lower-income children. Counter this — why is the competitive model still worth defending?', aiResponse: 'Access programs help at the margins, but they do not change the fundamental economics. Meanwhile, the pressure to win drives coaching behavior that harms kids directly. 18% of youth coaches would encourage a child to play through pain.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI cites coaching behavior and pressure to play through pain. Present evidence that competition benefits children\'s development.', aiResponse: 'Mental health benefits from physical activity are well-established, but they come from activity itself, not competition. A meta-analysis found equivalent mental health benefits from recreational and competitive activity. If the goal is healthy development, why insist on the competitive structure?' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI says physical activity provides the same benefits without competition. Explain what competition uniquely offers that recreation cannot.', aiResponse: 'Goal-setting and performance under pressure are valuable. But those same skills can develop through individual challenges — personal bests, skill progression, creative projects. The question is whether interpersonal competition is worth the documented psychological costs for the losers.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why do competitive sports do more good than harm? Address the winners-and-losers argument and close strong.', aiResponse: 'Well debated! Your argument that handling loss is itself a developmental benefit is thought-provoking. I think we agree that youth sports need reform. The 45 million children in organized sports deserve thoughtful answers from both of us. Thank you for a compelling exchange.' },
    ],
  },
  {
    id: 'dt8',
    topic: 'Voting should be mandatory for all citizens',
    context: 'US voter turnout averages ~60% in presidential elections. Australia\'s compulsory voting achieves 90%+. 22 countries mandate voting.',
    aiOpening: '',
    forRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue for mandatory voting. Lead with your strongest reason why it would improve democracy.', aiResponse: 'Representation sounds good in theory, but mandatory voting introduces a serious problem: forced participation from uninformed citizens. Compelled voters who do not follow politics make essentially random choices, diluting the voice of engaged citizens who have informed opinions.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues mandatory voting means uninformed people making random choices. Counter this directly.', aiResponse: 'That is an optimistic view, but evidence from mandatory voting countries is mixed. In Australia, donkey voting accounts for about 2-4% of votes. More concerning, mandatory voting has not eliminated political disengagement — it just forces its expression into spoiled ballots rather than honest abstention.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI points to donkey voting and says mandatory voting does not fix disengagement. Present your strongest evidence from countries with compulsory voting.', aiResponse: 'Australia\'s political stability is real, but correlation is not causation. Switzerland has voluntary voting with only ~45% turnout yet is among the world\'s most stable democracies. Political stability depends more on institutional design than turnout rates.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI uses Switzerland as a counter-example of a stable democracy with low turnout. Address this and strengthen your case.', aiResponse: 'Your argument about moral obligation is philosophically interesting, but a right exercised under compulsion is no longer a right — it is a duty. And penalizing non-compliance disproportionately affects marginalized communities who face genuine barriers to voting.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why should voting be mandatory? Address the enforcement burden concern and close with your strongest case.', aiResponse: 'A rigorous debate! Your argument for universal participation as a democratic ideal is compelling. My core concern remains the difference between encouraging participation and compelling it. Perhaps the real answer is removing all barriers to voting first. Thank you for the exchange.' },
    ],
    againstRounds: [
      { label: 'Opening Statement', playerPrompt: 'Argue against mandatory voting. Lead with your strongest point about why it would harm democracy.', aiResponse: 'Freedom of expression is important, but consider what voluntary voting actually produces: a system where wealthy, older, and white citizens vote at far higher rates. Your freedom to abstain has been weaponized by voter suppression tactics. Mandatory voting eliminates the entire suppression playbook overnight.' },
      { label: 'Rebuttal', playerPrompt: 'The AI argues mandatory voting would eliminate voter suppression. Counter this specific claim.', aiResponse: 'Removing barriers first is a reasonable approach, but consider how long that has been tried. The Voting Rights Act passed in 1965 — six decades later, voter suppression persists. At some point, the incremental approach has demonstrated its limits. Mandatory voting is not a last resort; it is a more effective first step.' },
      { label: 'Evidence & Examples', playerPrompt: 'The AI says 60 years of incremental reform have not solved voter suppression. Present your strongest evidence for why mandatory voting is the wrong solution.', aiResponse: 'Those examples are informative, but Australia shows enforcement does not need to be harsh — it is a small fine, and most people simply comply because it becomes cultural. The cultural shift is the point, not the penalty.' },
      { label: 'Addressing Weaknesses', playerPrompt: 'The AI says mandatory voting becomes cultural over time, like jury duty. Address why this cultural shift is still problematic.', aiResponse: 'Civic education is an excellent alternative, and I wish it had a better track record. But civics requirements have been declining for decades while participation drops. The "educate first, then they will vote" approach has been the strategy for a century, and turnout keeps falling.' },
      { label: 'Closing Argument', playerPrompt: 'Final statement. Why should voting remain voluntary? Address the "education has failed" argument and close strong.', aiResponse: 'An excellent debate! I think we share the goal of genuine democratic participation — we just disagree on whether it is better achieved through freedom or structure. Perhaps the answer is neither pure voluntarism nor strict compulsion, but creative middle ground. Thank you for a challenging exchange.' },
    ],
  },
];

const EXCHANGES = 5;
const ROUND_LABELS = ['Opening Statement', 'Rebuttal', 'Evidence & Examples', 'Addressing Weaknesses', 'Closing Argument'];

const SCORING_CRITERIA = [
  { key: 'relevance', label: 'Relevance', icon: '🎯' },
  { key: 'strength', label: 'Argument Strength', icon: '💪' },
  { key: 'evidence', label: 'Evidence Use', icon: '📊' },
];

export function ArgumentTennis({ onExit }: ArgumentTennisProps) {
  const { play } = useSounds();
  const { showAchievements } = useAchievementToast();

  const [phase, setPhase] = useState<Phase>('intro');
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic | null>(null);
  const [playerSide, setPlayerSide] = useState<'for' | 'against'>('for');
  const [exchange, setExchange] = useState(0);
  const [playerArgument, setPlayerArgument] = useState('');
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [aiUsingLive, setAiUsingLive] = useState(false);

  const getRounds = useCallback(() => {
    if (!selectedTopic) return [];
    return playerSide === 'for' ? selectedTopic.forRounds : selectedTopic.againstRounds;
  }, [selectedTopic, playerSide]);

  const startGame = useCallback(() => {
    setPhase('select_topic');
    setExchanges([]);
    setExchange(0);
    setTotalScore(0);
    setAiUsingLive(false);
  }, []);

  const selectTopicAndStart = useCallback((topic: DebateTopic, side: 'for' | 'against') => {
    setSelectedTopic(topic);
    setPlayerSide(side);
    setExchange(0);
    setExchanges([]);
    setPlayerArgument('');
    setTotalScore(0);
    setPhase('playing');
    play('powerup');
  }, [play]);

  const submitArgument = useCallback(async () => {
    if (!selectedTopic || playerArgument.trim().length < 10) return;

    const rounds = playerSide === 'for' ? selectedTopic.forRounds : selectedTopic.againstRounds;
    const round = rounds[exchange];
    const submittedArgument = playerArgument.trim();
    setPlayerArgument('');
    setPhase('ai_thinking');
    play('flip');

    try {
      const response = await fetch('/api/argument-tennis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic.topic,
          position: playerSide,
          roundLabel: round?.label || `Round ${exchange + 1}`,
          roundNumber: exchange,
          playerArgument: submittedArgument,
          previousExchanges: exchanges.map(ex => ({
            player: ex.player,
            ai: ex.ai,
            label: ex.label,
          })),
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setAiUsingLive(true);
      const scores = [data.scores.relevance, data.scores.strength, data.scores.evidence];
      const roundScore = scores.reduce((a: number, b: number) => a + b, 0);

      setExchanges(prev => [...prev, {
        player: submittedArgument,
        ai: data.counterArgument,
        scores,
        label: round?.label || `Exchange ${exchange + 1}`,
        feedback: data.feedback || '',
      }]);
      setTotalScore(t => t + roundScore);
      setPhase('ai_response');
      play('correct');
    } catch {
      // Fallback to pre-written responses with default scores
      const fallbackAi = round?.aiResponse || 'A fair point. Let me consider that.';
      const fallbackScores = [3, 3, 3];
      const roundScore = 9;

      setExchanges(prev => [...prev, {
        player: submittedArgument,
        ai: fallbackAi,
        scores: fallbackScores,
        label: round?.label || `Exchange ${exchange + 1}`,
        feedback: '',
      }]);
      setTotalScore(t => t + roundScore);
      setPhase('ai_response');
      play('correct');
    }
  }, [selectedTopic, playerArgument, playerSide, exchange, exchanges, play]);

  const continueToNext = useCallback(() => {
    if (exchange + 1 >= EXCHANGES) {
      updatePlayerStats(stats => ({
        ...stats,
        gamesPlayed: stats.gamesPlayed + 1,
      }));
      const newAchievements = checkAchievements();
      if (newAchievements.length > 0) showAchievements(newAchievements);
      play('complete');
      setPhase('result');
    } else {
      setExchange(e => e + 1);
      setPhase('playing');
    }
  }, [exchange, play, showAchievements]);

  const renderIntro = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-sage-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-800 mb-2">Argument Tennis</h2>
        <p className="text-ink-600 mb-6">
          Debate an AI opponent through 5 structured rounds. Each round has a specific purpose — build your case, counter theirs, and close strong.
        </p>
        <div className="bg-cream-100 rounded-xl p-4 mb-6 text-left space-y-2 text-sm text-ink-600">
          <p className="flex items-center gap-2"><span className="w-5 h-5 bg-gold-200 rounded-full flex items-center justify-center text-xs font-bold text-gold-700">1</span> Opening Statement — present your strongest case</p>
          <p className="flex items-center gap-2"><span className="w-5 h-5 bg-gold-200 rounded-full flex items-center justify-center text-xs font-bold text-gold-700">2</span> Rebuttal — counter your opponent&apos;s points</p>
          <p className="flex items-center gap-2"><span className="w-5 h-5 bg-gold-200 rounded-full flex items-center justify-center text-xs font-bold text-gold-700">3</span> Evidence — bring facts and examples</p>
          <p className="flex items-center gap-2"><span className="w-5 h-5 bg-gold-200 rounded-full flex items-center justify-center text-xs font-bold text-gold-700">4</span> Address Weaknesses — acknowledge and overcome</p>
          <p className="flex items-center gap-2"><span className="w-5 h-5 bg-gold-200 rounded-full flex items-center justify-center text-xs font-bold text-gold-700">5</span> Closing — summarize and persuade</p>
        </div>
        <Button variant="gold" size="lg" onClick={startGame} className="w-full">
          <MessageSquare className="w-5 h-5 mr-2" />
          Choose a Topic
        </Button>
      </motion.div>
    </div>
  );

  const renderSelectTopic = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <h2 className="font-display text-xl font-bold text-ink-800 mb-4 text-center">Choose a Debate Topic</h2>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {DEBATE_TOPICS.map(topic => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <p className="font-medium text-ink-800 mb-1">{topic.topic}</p>
                <p className="text-xs text-ink-400 mb-3">{topic.context}</p>
                <div className="flex gap-2">
                  <Button variant="gold" size="sm" onClick={() => selectTopicAndStart(topic, 'for')} className="flex-1">
                    <ThumbsUp className="w-4 h-4 mr-1" /> Argue FOR
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => selectTopicAndStart(topic, 'against')} className="flex-1">
                    <ThumbsDown className="w-4 h-4 mr-1" /> Argue AGAINST
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderPlaying = () => {
    if (!selectedTopic) return null;
    const rounds = getRounds();
    const currentRound = rounds[exchange];

    return (
      <div className="flex-1 flex flex-col p-4 md:p-6">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="gold">Round {exchange + 1}: {currentRound?.label}</Badge>
            <span className="text-sm font-bold text-gold-600">{totalScore} pts</span>
          </div>

          {/* Round progress stepper */}
          <div className="flex gap-1 mb-4">
            {ROUND_LABELS.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1.5 w-full rounded-full transition-colors ${
                  i < exchange ? 'bg-gold-400' : i === exchange ? 'bg-gold-500' : 'bg-ink-100'
                }`} />
                <span className={`text-[10px] leading-tight text-center hidden sm:block ${
                  i === exchange ? 'text-gold-600 font-semibold' : 'text-ink-300'
                }`}>{label}</span>
              </div>
            ))}
          </div>

          {/* Topic reminder */}
          <Card className="mb-3">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">{playerSide === 'for' ? 'FOR' : 'AGAINST'}</Badge>
                <p className="text-ink-800 font-medium text-sm">{selectedTopic.topic}</p>
              </div>
            </CardContent>
          </Card>

          {/* AI's previous response */}
          {exchange > 0 && exchanges.length > 0 && (
            <Card className="mb-3 bg-coral-50 border-coral-200">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-coral-600 mb-1">
                  AI Opponent — {exchanges[exchanges.length - 1].label}:
                </p>
                <p className="text-sm text-ink-700">{exchanges[exchanges.length - 1].ai}</p>
              </CardContent>
            </Card>
          )}

          {/* Coaching prompt */}
          <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 mb-3 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gold-800">{currentRound?.playerPrompt}</p>
          </div>

          {/* Player input */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={playerArgument}
              onChange={e => setPlayerArgument(e.target.value)}
              placeholder="Write your argument here..."
              className="flex-1 resize-none text-base leading-relaxed min-h-[120px] p-4 rounded-xl border-2 border-ink-200 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 outline-none transition-all"
            />
            <p className={`text-xs mt-1 ${playerArgument.trim().length < 10 ? 'text-ink-300' : 'text-sage-500'}`}>
              {playerArgument.trim().length} characters {playerArgument.trim().length < 10 && '(minimum 10)'}
            </p>
          </div>

          <div className="mt-3">
            <Button
              variant="gold"
              size="lg"
              onClick={submitArgument}
              disabled={playerArgument.trim().length < 10}
              className="w-full"
            >
              Submit {currentRound?.label}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAiThinking = () => (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-coral-600 animate-spin" />
        </div>
        <h3 className="font-display text-lg font-bold text-ink-800 mb-2">AI is analyzing your argument...</h3>
        <p className="text-sm text-ink-500">Crafting a counter-argument and scoring your response</p>
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-coral-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderAiResponse = () => {
    const lastExchange = exchanges[exchanges.length - 1];
    if (!lastExchange) return null;

    const roundScore = lastExchange.scores.reduce((a, b) => a + b, 0);
    const maxRoundScore = 15;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <h2 className="font-display text-lg font-bold text-ink-800 mb-1 text-center">
            Round {exchange + 1}: {lastExchange.label}
          </h2>

          {/* AI badge */}
          {aiUsingLive && (
            <div className="flex justify-center mb-3">
              <Badge variant="gold" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" /> AI-Powered Response
              </Badge>
            </div>
          )}

          {/* Player argument */}
          <Card className="mb-3 bg-sage-50/50 border-sage-200">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-sage-600 mb-1">Your {lastExchange.label.toLowerCase()}:</p>
              <p className="text-sm text-ink-700">{lastExchange.player}</p>
            </CardContent>
          </Card>

          {/* AI counter-argument */}
          <Card className="mb-3 bg-coral-50/50 border-coral-200">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-coral-600 mb-1">AI counter-argument:</p>
              <p className="text-sm text-ink-700">{lastExchange.ai}</p>
            </CardContent>
          </Card>

          {/* AI Scores */}
          <Card className="mb-3">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-ink-500 mb-3">Your scores for this round:</p>
              <div className="space-y-2">
                {SCORING_CRITERIA.map((criterion, idx) => (
                  <div key={criterion.key} className="flex items-center gap-3">
                    <span className="text-sm">{criterion.icon}</span>
                    <span className="text-xs text-ink-600 w-28">{criterion.label}</span>
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <div
                          key={v}
                          className={`h-3 flex-1 rounded-sm transition-colors ${
                            v <= lastExchange.scores[idx] ? 'bg-gold-400' : 'bg-ink-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-ink-600 w-6 text-right">{lastExchange.scores[idx]}/5</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink-700">Round Score</span>
                <span className={`text-lg font-bold ${
                  roundScore >= 12 ? 'text-sage-600' : roundScore >= 8 ? 'text-gold-600' : 'text-coral-600'
                }`}>{roundScore}/{maxRoundScore}</span>
              </div>
            </CardContent>
          </Card>

          {/* Coaching feedback */}
          {lastExchange.feedback && (
            <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-gold-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gold-800">{lastExchange.feedback}</p>
            </div>
          )}

          <Button variant="gold" size="lg" onClick={continueToNext} className="w-full">
            {exchange + 1 >= EXCHANGES ? 'See Results' : `Next: ${ROUND_LABELS[exchange + 1]}`}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  };

  const renderResult = () => {
    const maxPossible = EXCHANGES * 15;
    const percentage = Math.round((totalScore / maxPossible) * 100);
    const grade = percentage >= 80 ? 'Master Debater' : percentage >= 60 ? 'Strong Arguer' : percentage >= 40 ? 'Developing Voice' : 'Keep Practicing';

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className={`w-24 h-24 ${percentage >= 60 ? 'bg-gold-500' : 'bg-sage-500'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-ink-800 mb-1">Debate Complete!</h2>
          <p className="text-ink-600 mb-1">{grade}</p>
          {aiUsingLive && (
            <p className="text-xs text-gold-600 mb-4 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Scored by AI
            </p>
          )}

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl font-bold text-gold-600">{totalScore}</p>
                  <p className="text-xs text-ink-400">Total Score</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-sage-600">{percentage}%</p>
                  <p className="text-xs text-ink-400">Rating</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-ink-700">{EXCHANGES}</p>
                  <p className="text-xs text-ink-400">Rounds</p>
                </div>
              </div>

              {/* Per-round breakdown */}
              <div className="border-t border-ink-100 pt-4">
                <p className="text-xs text-ink-400 mb-2">Score per round</p>
                <div className="space-y-1.5">
                  {exchanges.map((ex, i) => {
                    const exScore = ex.scores.reduce((a, b) => a + b, 0);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-ink-400 w-28 text-right truncate">{ex.label}</span>
                        <div className="flex-1 h-3 bg-ink-50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              exScore >= 12 ? 'bg-sage-400' : exScore >= 8 ? 'bg-gold-400' : 'bg-coral-400'
                            }`}
                            style={{ width: `${(exScore / 15) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-ink-600 w-8">{exScore}/15</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="gold" size="lg" onClick={startGame} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
            <Button variant="secondary" size="lg" onClick={onExit} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Exit
            </Button>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderContent = () => {
    switch (phase) {
      case 'intro': return renderIntro();
      case 'select_topic': return renderSelectTopic();
      case 'playing': return renderPlaying();
      case 'ai_thinking': return renderAiThinking();
      case 'ai_response': return renderAiResponse();
      case 'result': return renderResult();
      default: return null;
    }
  };

  return (
    <GameLayout
      title="Argument Tennis"
      subtitle={selectedTopic ? selectedTopic.topic.slice(0, 40) + '...' : 'Structured Debate Game'}
      players={[
        { id: 'player', display_name: 'You', avatar_color: '#059669', score: totalScore, is_ready: true, is_connected: true },
        { id: 'ai', display_name: 'AI Opponent', avatar_color: '#DC2626', score: 0, is_ready: true, is_connected: true },
      ]}
      currentRound={phase === 'playing' || phase === 'ai_thinking' || phase === 'ai_response' ? exchange + 1 : undefined}
      totalRounds={EXCHANGES}
      showTimer={false}
      showRound={phase === 'playing' || phase === 'ai_thinking' || phase === 'ai_response'}
      onBack={onExit}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={phase + exchange}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </GameLayout>
  );
}
