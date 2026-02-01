// Структура данных товаров
export const productCategories = {
  tea: {
    id: 'tea',
    name: 'ЧАЙ',
    color: '#4CAF50', // ярко-зеленый
    subcategories: {
      'tea-group-1000': {
        id: 'tea-group-1000',
        name: 'Группа ЧАЙ: 1000 ГР',
        products: [
          { id: 'tea-1000-1', name: 'Чай черный 1000г', price: 45.00 },
          { id: 'tea-1000-2', name: 'Чай зеленый 1000г', price: 48.00 },
          { id: 'tea-1000-3', name: 'Чай улун 1000г', price: 52.00 },
        ]
      },
      'tea-group-500': {
        id: 'tea-group-500',
        name: 'Группа ЧАЙ: 500 ГР',
        products: [
          { id: 'tea-500-1', name: 'Чай черный 500г', price: 25.00 },
          { id: 'tea-500-2', name: 'Чай зеленый 500г', price: 26.00 },
          { id: 'tea-500-3', name: 'Чай улун 500г', price: 28.00 },
        ]
      },
      'tea-group-250': {
        id: 'tea-group-250',
        name: 'Группа ЧАЙ: 250ГР',
        products: [
          { id: 'tea-250-1', name: 'Чай черный 250г', price: 15.00 },
          { id: 'tea-250-2', name: 'Чай зеленый 250г', price: 16.00 },
          { id: 'tea-250-3', name: 'Чай улун 250г', price: 17.00 },
        ]
      },
      'tea-gift-box': {
        id: 'tea-gift-box',
        name: 'Подарочный набор (коробка) 135р',
        products: [
          { id: 'tea-gift-1', name: 'Подарочный набор чая', price: 135.00 },
        ]
      }
    }
  },
  coffeeDrinks: {
    id: 'coffeeDrinks',
    name: 'КОФЕЙНЫЕ НАПИТКИ',
    color: '#F44336', // ярко-красный
    subcategories: {
      'coffee-drinks-group-1000': {
        id: 'coffee-drinks-group-1000',
        name: 'Группа КОФЕЙНЫЕ НАПИТКИ: 1000 ГР',
        products: [
          { id: 'coffee-drinks-1000-1', name: 'Кофейный напиток 1000г', price: 35.00 },
          { id: 'coffee-drinks-1000-2', name: 'Кофейный напиток премиум 1000г', price: 42.00 },
        ]
      },
      'coffee-drinks-group-500': {
        id: 'coffee-drinks-group-500',
        name: 'Группа КОФЕЙНЫЕ НАПИТКИ: 500 ГР',
        products: [
          { id: 'coffee-drinks-500-1', name: 'Кофейный напиток 500г', price: 20.00 },
          { id: 'coffee-drinks-500-2', name: 'Кофейный напиток премиум 500г', price: 24.00 },
        ]
      },
      'coffee-drinks-group-250': {
        id: 'coffee-drinks-group-250',
        name: 'Группа КОФЕЙНЫЕ НАПИТКИ: 250ГР',
        products: [
          { id: 'coffee-drinks-250-1', name: 'Кофейный напиток 250г', price: 12.00 },
          { id: 'coffee-drinks-250-2', name: 'Кофейный напиток премиум 250г', price: 15.00 },
        ]
      },
      'coffee-drinks-gift-box': {
        id: 'coffee-drinks-gift-box',
        name: 'Подарочный набор (коробка) 135р',
        products: [
          { id: 'coffee-drinks-gift-1', name: 'Подарочный набор кофейных напитков', price: 135.00 },
        ]
      }
    }
  },
  packagedCoffee: {
    id: 'packagedCoffee',
    name: 'КОФЕ ФАСОВАННЫЙ',
    color: '#2E7D32', // темно-зеленый
    subcategories: {
      'coffee-group-1000': {
        id: 'coffee-group-1000',
        name: 'Группа КОФЕ: 1000 ГР',
        products: [
          { id: 'coffee-1000-1', name: 'Кофе арабика 1000г', price: 55.00 },
          { id: 'coffee-1000-2', name: 'Кофе робуста 1000г', price: 45.00 },
          { id: 'coffee-1000-3', name: 'Кофе смесь 1000г', price: 50.00 },
        ]
      },
      'coffee-group-500': {
        id: 'coffee-group-500',
        name: 'Группа КОФЕ: 500 ГР',
        products: [
          { id: 'coffee-500-1', name: 'Кофе арабика 500г', price: 30.00 },
          { id: 'coffee-500-2', name: 'Кофе робуста 500г', price: 25.00 },
          { id: 'coffee-500-3', name: 'Кофе смесь 500г', price: 27.00 },
        ]
      },
      'coffee-group-250': {
        id: 'coffee-group-250',
        name: 'Группа КОФЕ: 250ГР',
        products: [
          { id: 'coffee-250-1', name: 'Кофе арабика 250г', price: 18.00 },
          { id: 'coffee-250-2', name: 'Кофе робуста 250г', price: 15.00 },
          { id: 'coffee-250-3', name: 'Кофе смесь 250г', price: 16.00 },
        ]
      },
      'coffee-gift-box': {
        id: 'coffee-gift-box',
        name: 'Подарочный набор (коробка) 135р',
        products: [
          { id: 'coffee-gift-1', name: 'Подарочный набор кофе', price: 135.00 },
        ]
      }
    }
  },
  teaCocoaDrinks: {
    id: 'teaCocoaDrinks',
    name: 'ЧАЙ / КАКАО / НАПИТКИ',
    color: '#9C27B0', // ярко-фиолетовый
    subcategories: {
      'tea-cocoa-group-1000': {
        id: 'tea-cocoa-group-1000',
        name: 'Группа ЧАЙ/КАКАО/НАПИТКИ: 1000 ГР',
        products: [
          { id: 'tea-cocoa-1000-1', name: 'Какао 1000г', price: 40.00 },
          { id: 'tea-cocoa-1000-2', name: 'Напиток шоколадный 1000г', price: 38.00 },
        ]
      },
      'tea-cocoa-group-500': {
        id: 'tea-cocoa-group-500',
        name: 'Группа ЧАЙ/КАКАО/НАПИТКИ: 500 ГР',
        products: [
          { id: 'tea-cocoa-500-1', name: 'Какао 500г', price: 22.00 },
          { id: 'tea-cocoa-500-2', name: 'Напиток шоколадный 500г', price: 21.00 },
        ]
      },
      'tea-cocoa-group-250': {
        id: 'tea-cocoa-group-250',
        name: 'Группа ЧАЙ/КАКАО/НАПИТКИ: 250ГР',
        products: [
          { id: 'tea-cocoa-250-1', name: 'Какао 250г', price: 13.00 },
          { id: 'tea-cocoa-250-2', name: 'Напиток шоколадный 250г', price: 12.00 },
        ]
      },
      'tea-cocoa-gift-box': {
        id: 'tea-cocoa-gift-box',
        name: 'Подарочный набор (коробка) 135р',
        products: [
          { id: 'tea-cocoa-gift-1', name: 'Подарочный набор чай/какао/напитки', price: 135.00 },
        ]
      }
    }
  }
}
