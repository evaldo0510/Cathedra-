
export interface MissalPart {
  name: string;
  rubric?: string;
  latin: string;
  vernacular: string;
}

export interface MissalSection {
  title: string;
  subtitle: string;
  parts: MissalPart[];
}

export const MISSAL_DATABASE: MissalSection[] = [
  {
    title: 'Ritus Initiales',
    subtitle: 'Ritos Iniciais',
    parts: [
      {
        name: 'Salutatio / Saudação',
        rubric: 'O sacerdote, voltado para o povo, diz:',
        latin: 'S: In nómine Patris, et Fílii, et Spíritus Sancti.\nP: Amen.\nS: Grátia Dómini nostri Iesu Christi, et cáritas Dei, et communicátio Sancti Spíritus sit cum ómnibus vobis.\nP: Et cum spíritu tuo.',
        vernacular: 'S: Em nome do Pai, e do Filho, e do Espírito Santo.\nP: Amém.\nS: A graça de nosso Senhor Jesus Cristo, o amor do Pai e a comunhão do Espírito Santo estejam convosco.\nP: Bendito seja Deus que nos reuniu no amor de Cristo.'
      },
      {
        name: 'Actus Pænitentiális / Ato Penitencial',
        rubric: 'O sacerdote convida os fiéis ao arrependimento:',
        latin: 'Confíteor Deo omnipoténti et vobis, fratres, quia peccávi nimis cogitatióne, verbo, ópere et omissióne: mea culpa, mea culpa, mea máxima culpa.',
        vernacular: 'Confesso a Deus todo-poderoso e a vós, irmãos e irmãs, que pequei muitas vezes por pensamentos e palavras, atos e omissões, por minha culpa, minha tão grande culpa.'
      }
    ]
  },
  {
    title: 'Liturgia Verbi',
    subtitle: 'Liturgia da Palavra',
    parts: [
      {
        name: 'Evangelium / Evangelho',
        rubric: 'O diácono ou o sacerdote diz:',
        latin: 'S: Dóminus vobíscum.\nP: Et cum spíritu tuo.\nS: Léctio sancti Evangélii secúndum N.\nP: Glória tibi, Dómine.',
        vernacular: 'S: O Senhor esteja convosco.\nP: Ele está no meio de nós.\nS: Proclamação do Evangelho de Jesus Cristo segundo N.\nP: Glória a vós, Senhor.'
      }
    ]
  },
  {
    title: 'Liturgia Eucharistica',
    subtitle: 'Liturgia Eucarística',
    parts: [
      {
        name: 'Præfatio / Prefácio',
        rubric: 'Diálogo inicial revisado:',
        latin: 'S: Sursum corda.\nP: Habémus ad Dóminum.\nS: Grátias agámus Dómino Deo nostro.\nP: Dignum et iustum est.',
        vernacular: 'S: Corações ao alto.\nP: O nosso coração está em Deus.\nS: Demos graças ao Senhor nosso Deus.\nP: É nosso dever e nossa salvação.'
      },
      {
        name: 'Sanctus',
        latin: 'Sanctus, Sanctus, Sanctus Dóminus Deus Sábaoth. Pleni sunt cæli et terra glória tua. Hosánna in excélsis. Benedíctus qui venit in nómine Dómini. Hosánna in excélsis.',
        vernacular: 'Santo, Santo, Santo, Senhor Deus do universo. O céu e a terra proclamam a vossa glória. Hosana nas alturas. Bendito o que vem em nome do Senhor. Hosana nas alturas.'
      }
    ]
  }
];

export const getMissalLocal = () => MISSAL_DATABASE;
