/* African history for Savanna Run, as terrain.
 *
 * Each level is a place and a period, and the run through it passes the
 * things that were there. The rule this bank is written to: **a fact a child
 * meets mid-run is a thing, not a date**. A stone obelisk, a mud-brick
 * mosque, a wall of dry-stone, a coin with a king's face on it. Dates and
 * names arrive on the checkpoint card, where there is time to read them.
 *
 * Every entry carries a `source` naming what the claim rests on. This is not
 * decoration: the arcade's other banks are facts about arithmetic, which are
 * checkable by doing the sum, and these are facts about the past, which are
 * not. A claim that cannot be sourced does not go in.
 *
 * Content spans the four eras asked for -- classical kingdoms, the West
 * African empires, the southern and east African states, and resistance and
 * independence -- plus Kenya, which gets its own level rather than a footnote.
 */
(function () {
  'use strict';

  /* `scenery` drives the parallax layers. Each level names a palette and a
     handful of shapes the renderer knows how to draw; adding a level means
     adding shapes to the renderer, not a sprite sheet. */
  const LEVELS = [
    {
      id: 'aksum',
      name: 'Aksum',
      where: 'Highlands of Tigray, northern Ethiopia',
      when: 'c. 100 – 940 CE',
      palette: { sky: ['#ffd9a0', '#ffe9c9'], far: '#c98b5e', mid: '#9c6644', near: '#6b4423', ground: '#8a5a35' },
      scenery: ['obelisk', 'obelisk', 'acacia', 'stela'],
      intro: 'Aksum stood where the Red Sea trade met the highlands. Its kings minted their own gold coinage — the first in sub-Saharan Africa to do so — and its ships carried ivory, tortoiseshell and salt to Arabia and India.',
      facts: [
        { t: 'The obelisks', d: 'Aksum\'s granite stelae are single pieces of stone, some over 20 metres tall. The largest ever quarried, the Great Stele, cracked and was never raised — it still lies where it fell.',
          source: 'UNESCO World Heritage listing, "Aksum" (inscribed 1980).' },
        { t: 'The coinage', d: 'Aksumite kings issued gold, silver and bronze coins stamped with their own portraits and, after the 4th century, with a cross. The coins are how the succession of kings is dated.',
          source: 'Munro-Hay, "Aksum: An African Civilisation of Late Antiquity" (1991), ch. 7.' },
        { t: 'Ge\'ez', d: 'The Ge\'ez script of the inscriptions is still used today for liturgical writing in the Ethiopian Orthodox Church.',
          source: 'Ethiopian Orthodox Tewahedo Church liturgical practice; Daniels, "The World\'s Writing Systems" (1996).' },
        { t: 'Ezana', d: 'King Ezana adopted Christianity in the 4th century, around the same generation as the Roman Empire — and the kingdom kept its own script and liturgy rather than adopting Latin or Greek.',
          source: 'Munro-Hay (1991), ch. 10; coin legends of Ezana.' }
      ]
    },

    {
      id: 'mali',
      name: 'Mali',
      where: 'The Niger bend, West Africa',
      when: 'c. 1235 – 1600 CE',
      palette: { sky: ['#f6c26b', '#ffe3b0'], far: '#d9a441', mid: '#b5762a', near: '#7d4f1d', ground: '#a9743a' },
      scenery: ['mosque', 'acacia', 'dune', 'mosque'],
      intro: 'Mali grew from the gold fields of Bambuk and the salt caravans of the Sahara. Timbuktu, on the Niger\'s northern edge, became a city of books: the Sankore mosque was one of three teaching centres, and manuscripts were worth more than the gold that paid for them.',
      facts: [
        { t: 'Mansa Musa', d: 'Musa I\'s pilgrimage to Mecca in 1324 carried so much gold that its spending in Cairo depressed the metal\'s price there for years afterwards. He is the reason Mali appears on the Catalan Atlas of 1375, drawn by a Majorcan cartographer who had never been south of the Sahara.',
          source: 'al-Umari, "Masalik al-absar" (14th c.), trans. Levtzion & Hopkins, "Corpus of Early Arabic Sources for West African History" (1981); Catalan Atlas, BnF.' },
        { t: 'The manuscripts', d: 'Timbuktu\'s manuscript collections cover astronomy, medicine, law and poetry. Families kept them privately for centuries, which is why they survived; tens of thousands are now being digitised.',
          source: 'SAVAMA-DCI (Sauvegarde et Valorisation des Manuscrits pour la Défense de la Culture Islamique), Bamako.' },
        { t: 'Salt and gold', d: 'The trans-Saharan trade moved salt south and gold north. Salt was cut into slabs at Taghaza and was worth its weight in gold at the southern end of the route, because the savanna has no salt of its own.',
          source: 'Ibn Battuta\'s account of his 1352–53 journey, in Levtzion & Hopkins (1981).' },
        { t: 'Sankore', d: 'The Sankore mosque in Timbuktu was rebuilt in the 15th century with a distinctive pyramidal minaret and protruding toron beams — the same timber-rib construction used across the Sahel.',
          source: 'UNESCO World Heritage listing, "Timbuktu" (1988).' }
      ]
    },

    {
      id: 'zimbabwe',
      name: 'Great Zimbabwe',
      where: 'The Zimbabwe plateau, southern Africa',
      when: 'c. 1100 – 1450 CE',
      palette: { sky: ['#bfe3c9', '#e3f3e6'], far: '#8fb98f', mid: '#5f8f63', near: '#3d6642', ground: '#7a8f55' },
      scenery: ['wall', 'acacia', 'wall', 'baobab'],
      intro: 'Great Zimbabwe was built from granite blocks cut and laid without mortar — the largest stone structure in sub-Saharan Africa. Its people traded gold and ivory to the Swahili coast, and goods from as far as China have been found in its ruins.',
      facts: [
        { t: 'Dry-stone walls', d: 'The walls are granite, split along natural seams and stacked dry, so the structure flexes rather than cracks. The Great Enclosure\'s outer wall runs about 250 metres around and rises 11 metres.',
          source: 'UNESCO World Heritage listing, "Great Zimbabwe National Monument" (1986); Garlake, "Great Zimbabwe" (1973).' },
        { t: 'The soapstone birds', d: 'Eight carved soapstone birds stood on monoliths in the eastern enclosure. One was taken to Cecil Rhodes\'s estate in Cape Town in 1890; the others were dispersed, and most have since been returned.',
          source: 'Zimbabwe Museums and Monuments; Matenga, "The Soapstone Birds of Great Zimbabwe" (1998).' },
        { t: 'Trade', d: 'Glass beads from India, porcelain from China and coins from Kilwa have been excavated at the site — a thousand kilometres from the coast, up the Save river route.',
          source: 'Garlake (1973); excavation reports of the 1929 and 1958 campaigns.' },
        { t: 'The name', d: '"Zimbabwe" comes from the Shona *dzimba-dza-mabwe*, "houses of stone". The modern nation took the name from the ruins in 1980.',
          source: 'Shona lexicon; Beach, "The Shona and Zimbabwe 900–1850" (1980).' }
      ]
    },

    {
      id: 'kilwa',
      name: 'Kilwa',
      where: 'Kilwa Kisiwani, the Swahili coast',
      when: 'c. 900 – 1500 CE',
      palette: { sky: ['#a8d8e8', '#d9eef5'], far: '#7fb3c4', mid: '#4f8a9c', near: '#2f6472', ground: '#c9b58a' },
      scenery: ['dhow', 'palm', 'ruin', 'palm'],
      intro: 'Kilwa Kisiwani was the great port of the Swahili coast, trading gold from Zimbabwe and ivory north to Arabia and India. Its merchants built coral-stone houses and a Great Mosque with domes and vaults — and wrote in Swahili in Arabic script.',
      facts: [
        { t: 'The Great Mosque', d: 'Kilwa\'s Great Mosque was enlarged over centuries; its domes and barrel vaults were built of coral rag and lime, and the 14th-century extension is one of the finest pieces of Swahili architecture surviving.',
          source: 'UNESCO World Heritage listing, "Ruins of Kilwa Kisiwani and Songo Mnara" (1981).' },
        { t: 'The gold trade', d: 'Kilwa\'s wealth came from Sofala, south of the Zambezi, where gold from the interior reached the coast. Ibn Battuta called Kilwa one of the most beautiful cities he had seen.',
          source: 'Ibn Battuta, "Travels", in Levtzion & Hopkins (1981); Freeman-Grenville, "The East African Coast" (1962).' },
        { t: 'Swahili', d: 'Swahili is a Bantu language with a large Arabic vocabulary, written in Arabic script for centuries before the Latin alphabet was adopted. It is the shared language of the coast from Somalia to Mozambique.',
          source: 'Nurse & Hinnebusch, "Swahili and Sabaki" (1993).' },
        { t: 'The dhows', d: 'Coastal dhows — lateen-rigged, sewn or nailed — carried the trade. The same hull shapes are still built on the coast today.',
          source: 'Prins, "The Swahili-Speaking Peoples of Zanzibar and the East African Coast" (1961).' }
      ]
    },

    {
      id: 'kenya',
      name: 'Kenya',
      where: 'The Rift Valley and the coast',
      when: 'c. 1000 CE – 1963',
      palette: { sky: ['#ffc98a', '#ffe0b8'], far: '#c79a6b', mid: '#9c7248', near: '#6a4a2e', ground: '#8f6b45' },
      scenery: ['acacia', 'hills', 'acacia', 'train'],
      intro: 'Kenya\'s history runs from the Swahili city-states of the coast — Mombasa, Malindi, Lamu — through the inland kingdoms and the arrival of the railway, to a independence won in 1963 after the Mau Mau uprising. The country is named for Mount Kenya, and its flag carries a shield and spears.',
      facts: [
        { t: 'Mombasa and Fort Jesus', d: 'The Portuguese built Fort Jesus at Mombasa in 1593 to hold the coast. It changed hands nine times between 1593 and 1875 — Portuguese, Omani, and briefly local Swahili forces — which is why its plan is a star rather than a square.',
          source: 'UNESCO World Heritage listing, "Fort Jesus, Mombasa" (2011); Kirkman, "Fort Jesus: A Portuguese Fortress on the East African Coast" (1974).' },
        { t: 'The railway', d: 'The Uganda Railway reached Nairobi in 1899 — the city began as a rail depot, not a settlement. The line from Mombasa to Lake Victoria took five years and cost thousands of lives, most of them Indian labourers brought in to build it.',
          source: 'Kenya Railways historical record; Miller, "The Lunatic Express" (1971).' },
        { t: 'Mau Mau', d: 'The Mau Mau uprising against British rule began in the early 1950s, largely among the Kikuyu. The state of emergency lasted from 1952 to 1960; the British response included mass detention camps, a history formally acknowledged in the 2013 settlement.',
          source: 'Anderson, "Histories of the Hanged" (2005); Elkins, "Imperial Reckoning" (2005); UK Foreign Office settlement, June 2013.' },
        { t: 'Independence', d: 'Kenya became independent on 12 December 1963, with Jomo Kenyatta as prime minister and then president. The republic was declared a year later, in 1964.',
          source: 'Kenya Independence Act 1963; official Kenyan government record.' }
      ]
    }
  ];

  /* The final level is the resistance-and-modern era, reached after Kenya.
     It is a level rather than a card because the run should end somewhere,
     and 1963 is where Kenya's own story reaches the present. */
  LEVELS.push({
    id: 'adwa',
    name: 'Adwa',
    where: 'The Tigray highlands, Ethiopia',
    when: '1896',
    palette: { sky: ['#ffb88a', '#ffd6b0'], far: '#b5765a', mid: '#8a4f3c', near: '#5c3328', ground: '#7a4b3a' },
    scenery: ['hills', 'obelisk', 'hills', 'acacia'],
    intro: 'On 1 March 1896 an Ethiopian army under Emperor Menelik II and Empress Taytu defeated an Italian force at Adwa. It was the decisive battle of the First Italo-Ethiopian War, and it kept Ethiopia independent at a time when almost the whole continent had been colonised.',
    facts: [
      { t: 'Adwa', d: 'The battle was fought near the town of Adwa in Tigray. The Italian army under Oreste Baratieri was routed; the Treaty of Addis Ababa later that year recognised Ethiopian sovereignty.',
          source: 'Rubenson, "The Survival of Ethiopian Independence" (1976); Jonas, "The Battle of Adwa" (2010).' },
      { t: 'Taytu', d: 'Empress Taytu Betul commanded her own troops at Adwa and is credited with the strategy of denying the Italians water by occupying the springs. Her role is recorded in Ethiopian chronicles of the campaign.',
          source: 'Ethiopian royal chronicles; Jonas (2010), ch. 5.' },
      { t: 'A shared victory', d: 'Ethiopia\'s army included soldiers from across the empire and, by most accounts, from other African states as well — Adwa became a symbol for anti-colonial movements from the Caribbean to South Africa.',
          source: 'Jonas (2010); Rubenson (1976).' },
      { t: 'The flags', d: 'Ethiopia is one of only two African states never colonised (the other is Liberia). Its red, yellow and green became the colours of Pan-Africanism, adopted by Ghana\'s flag in 1957 and many since.',
          source: 'Ethiopian and Ghanaian state records; Pan-African colour symbolism, documented in flag histories.' }
    ]
  });

  window.AfricanHistory = { LEVELS };
})();
