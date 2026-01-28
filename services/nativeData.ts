
import { Saint, Verse, DailyLiturgyContent } from "../types";

export const NATIVE_DAILY_VERSES = [
  { verse: "No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.", reference: "João 1, 1", imageUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1600" },
  { verse: "O Senhor é o meu pastor, nada me faltará.", reference: "Salmo 22 (23), 1", imageUrl: "https://images.unsplash.com/photo-1515606378517-3451a42adc42?q=80&w=1600" },
  { verse: "Eu sou o caminho, a verdade e a vida.", reference: "João 14, 6", imageUrl: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=1600" },
  { verse: "A palavra de Deus é viva e eficaz.", reference: "Hebreus 4, 12", imageUrl: "https://images.unsplash.com/photo-1519810755548-39cd217da494?q=80&w=1600" }
];

export const NATIVE_SAINTS: Saint[] = [
  { 
    name: "São Francisco de Assis", 
    feastDay: "4 de Outubro", 
    patronage: "Ecologia e Pobreza", 
    biography: "O Poverello de Assis. Renunciou a todas as riquezas para seguir a Cristo na mais absoluta pobreza, fundando a Ordem dos Frades Menores.",
    image: "https://images.unsplash.com/photo-1548610762-656391d1ad4d?q=80&w=800",
    quote: "Comece fazendo o que é necessário, depois o que é possível e, de repente, estará fazendo o impossível."
  },
  { 
    name: "Santo Agostinho", 
    feastDay: "28 de Agosto", 
    patronage: "Teólogos e Impressores", 
    biography: "Bispo de Hipona e Doutor da Igreja. Sua jornada de conversão, descrita nas 'Confissões', é um farol para a inteligência da fé.",
    image: "https://images.unsplash.com/photo-1543158021-00212008304f?q=80&w=800",
    quote: "Fizeste-nos para Ti, Senhor, e inquieto está o nosso coração enquanto não repousar em Ti."
  }
];

export const getNativeLiturgy = (dateStr: string): DailyLiturgyContent => {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDate();
  const month = d.getMonth();
  const seed = day + month;

  const gospels = [
    { 
      ref: "Mateus 5, 1-12", 
      text: "Vendo as multidões, Jesus subiu ao monte e sentou-se. Seus discípulos aproximaram-se, e Ele começou a ensiná-los, dizendo:\n\n'Bem-aventurados os pobres em espírito, porque deles é o Reino dos Céus. Bem-aventurados os aflitos, porque serão consolados. Bem-aventurados os mansos, porque herdarão a terra.\n\nBem-aventurados os que têm fome e sede de justiça, porque serão saciados. Bem-aventurados os misericordiosos, porque alcançarão misericórdia. Bem-aventurados os puros de coração, porque verão a Deus.\n\nBem-aventurados os que promovem a paz, porque serão chamados filhos de Deus. Bem-aventurados os que são perseguidos por causa da justiça, porque deles é o Reino dos Céus. Bem-aventurados sois vós, quando vos injuriarem e perseguirem e, mentindo, disserem todo o mal contra vós por Minha causa. Alegrai-vos e exultai, porque é grande o vosso galardão nos céus'." 
    },
    { 
      ref: "João 15, 1-8", 
      text: "Eu sou a videira verdadeira, e Meu Pai é o agricultor. Todo ramo que em Mim não dá fruto, Ele o corta; e todo ramo que dá fruto, Ele o limpa, para que dê mais fruto ainda.\n\nVós já estais limpos por causa da palavra que vos tenho falado. Permanecei em Mim, e Eu permanecerei em vós. Como o ramo não pode dar fruto por si mesmo, se não permanecer na videira, assim também vós, se não permanecerdes em Mim.\n\nEu sou a videira, vós os ramos. Quem permanece em Mim e Eu nele, esse dá muito fruto; porque sem Mim nada podeis fazer. Se alguém não permanecer em Mim, será lançado fora, como o ramo, e secará; e os colhem e lançam no fogo, e ardem." 
    }
  ];

  const selections = gospels[seed % gospels.length];

  return {
    date: dateStr,
    collect: "Deus eterno e todo-poderoso, guiai-nos em nossas ações para que, em nome do vosso amado Filho, possamos produzir frutos de boas obras para a vossa glória.",
    firstReading: { 
      reference: seed % 2 === 0 ? "Filipenses 4, 4-9" : "Isaías 40, 1-5", 
      text: seed % 2 === 0 
        ? "Irmãos: Alegrai-vos sempre no Senhor; repito, alegrai-vos! Seja a vossa amabilidade conhecida de todos os homens. O Senhor está próximo. Não vos inquieteis com nada; mas apresentai a Deus todas as vossas necessidades pela oração e pela súplica, acompanhadas de ação de graças. E a paz de Deus, que sobrepassa todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus. Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é nobre, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, tudo o que é virtuoso e louvável, seja objeto dos vossos pensamentos. O que aprendestes, recebestes, ouvistes e vistes em mim, isso praticai. E o Deus da paz estará convosco." 
        : "Consolai, consolai o meu povo, diz o vosso Deus. Falai ao coração de Jerusalém e dizei-lhe que a sua escravidão terminou, que a sua iniquidade foi perdoada, que recebeu da mão do Senhor o dobro por todos os seus pecados. Uma voz clama: 'No deserto preparai o caminho do Senhor; endireitai na estepe uma estrada para o nosso Deus. Todo vale será aterrado, todo monte e colina serão rebaixados; as passagens tortuosas ficarão retas e os caminhos acidentados serão aplainados. Então a glória do Senhor se manifestará, e todos os homens a verão juntos, pois a boca do Senhor falou'."
    },
    psalm: { 
      title: "Salmo 22 (23)", 
      text: "O Senhor é o meu pastor: nada me faltará. Em verdes pastagens me faz repousar, para as águas tranquilas me conduz. Restaura as minhas forças, guia-me pelo caminho certo, por amor do seu nome. Ainda que eu passe por vales escuros, nada temerei, porque estais comigo." 
    },
    gospel: { 
      reference: selections.ref, 
      text: selections.text,
      reflection: "A Palavra de hoje nos convida a permanecer em Cristo como os ramos na videira, lembrando que sem Ele, nada podemos fazer."
    }
  };
};

export const getDailyNativeContent = () => {
  const d = new Date();
  const day = d.getDate();
  const month = d.getMonth();
  const idx = (day + month) % NATIVE_SAINTS.length;
  return {
    verse: NATIVE_DAILY_VERSES[idx % NATIVE_DAILY_VERSES.length],
    saint: NATIVE_SAINTS[idx]
  };
};
