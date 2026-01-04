import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, ArrowLeft } from 'lucide-react';

// Список городов для демонстрации
const cities = [
  'Москва',
  'Санкт-Петербург',
  'Новосибирск',
  'Екатеринбург',
  'Казань',
  'Нижний Новгород',
  'Челябинск',
  'Самара',
  'Омск',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Воронеж',
  'Пермь',
  'Волгоград',
  'Краснодар',
  'Саратов',
  'Тюмень',
  'Тольятти',
  'Ижевск',
  'Барнаул',
  'Ульяновск',
  'Иркутск',
  'Хабаровск',
  'Владивосток',
];

export default function CitySelector() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  // Фильтрация городов по запросу
  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContinue = () => {
    if (selectedCity) {
      console.log('Selected city:', selectedCity);
      // Здесь можно добавить переход на следующий экран
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col">
      {/* Шапка с кнопкой назад */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="text-white"
        >
          <ArrowLeft size={24} />
        </motion.button>
      </motion.div>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-32">
        {/* Иконка города */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
        >
          <MapPin size={80} strokeWidth={1.5} className="mb-8" />
        </motion.div>

        {/* Заголовок и описание */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl mb-3">Выберите город</h1>
          <p className="text-gray-400 text-sm max-w-xs">
            Укажите город для размещения ваших объявлений
          </p>
        </motion.div>

        {/* Поле поиска */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-sm mb-6"
        >
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск города"
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#3A3A3A] transition-colors"
            />
          </div>
        </motion.div>

        {/* Список городов */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-sm flex-1 overflow-hidden mb-6"
        >
          <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <motion.button
                    key={city}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.05, 0.3),
                    }}
                    onClick={() => setSelectedCity(city)}
                    className={`w-full text-left px-6 py-4 rounded-2xl mb-2 transition-all ${
                      selectedCity === city
                        ? 'bg-white text-black'
                        : 'bg-[#1A1A1A] hover:bg-[#252525]'
                    }`}
                  >
                    <motion.div
                      animate={{
                        scale: selectedCity === city ? 1.02 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {city}
                    </motion.div>
                  </motion.button>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-12 text-gray-500"
                >
                  Город не найден
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Кнопка продолжить - зафиксирована внизу */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pt-4 pb-6 px-6"
      >
        <div className="w-full max-w-sm mx-auto">
          <motion.button
            onClick={handleContinue}
            disabled={!selectedCity}
            whileHover={selectedCity ? { scale: 1.02 } : {}}
            whileTap={selectedCity ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-2xl transition-all ${
              selectedCity
                ? 'bg-white text-black cursor-pointer'
                : 'bg-[#1A1A1A] text-gray-600 cursor-not-allowed'
            }`}
          >
            Продолжить
          </motion.button>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2A2A2A;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3A3A3A;
        }
      `}</style>
    </div>
  );
}