export const carData = {
  Japanese: { emoji: '🇯🇵', makes: { Toyota: ['Camry','Corolla','RAV4','Land Cruiser','Fortuner'], Honda: ['Civic','Accord','CR-V','HR-V'], Nissan: ['Altima','Sentra','Patrol','X-Trail'], Mazda: ['CX-5','Mazda3','Mazda6'] } },
  German: { emoji: '🇩🇪', makes: { BMW: ['3 Series','5 Series','X3','X5'], Mercedes: ['C-Class','E-Class','S-Class','GLE'], Audi: ['A3','A4','Q5','Q7'], VW: ['Golf','Tiguan','Passat'] } },
  American: { emoji: '🇺🇸', makes: { Ford: ['F-150','Mustang','Explorer','Ranger'], Chevy: ['Silverado','Tahoe','Malibu'], Dodge: ['Charger','Challenger','Durango'], Jeep: ['Wrangler','Grand Cherokee','Compass'] } },
  Korean: { emoji: '🇰🇷', makes: { Hyundai: ['Elantra','Sonata','Tucson','Santa Fe'], Kia: ['Sportage','Sorento','K5','Cerato'], Genesis: ['G70','G80','GV70'] } },
  Chinese: { emoji: '🇨🇳', makes: { Chery: ['Tiggo 7','Tiggo 8','Arrizo 5'], MG: ['MG5','HS','ZS'], Haval: ['H6','Jolion','H9'], Geely: ['Coolray','Tugella','Emgrand'], BYD: ['Song','Han','Atto 3'], Changan: ['CS35','CS75','Uni-T'], Jetour: ['X70','Dashing','T2'] } },
  French: { emoji: '🇫🇷', makes: { Peugeot: ['208','308','3008','5008'], Renault: ['Duster','Megane','Koleos'], Citroen: ['C3','C4','C5 Aircross'] } }
};

export const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
