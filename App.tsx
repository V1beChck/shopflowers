import React, { useState, useEffect, useMemo } from 'react';

// Mock Data Types
type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: 'flowers' | 'bouquets' | 'packaging';
  country: string;
  color: string;
  inStock: number; // Available quantity
  isNew: boolean;
};

type CartItem = {
  productId: number;
  quantity: number;
};

type Order = {
  id: number;
  userId: string; // User login
  timestamp: number;
  customerName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentType: 'cash' | 'card';
  items: { productId: number; quantity: number; price: number }[];
  totalCost: number;
  status: 'new' | 'processing' | 'confirmed' | 'cancelled'; // 'в работе', 'выполнено'
  cancelReason?: string;
};

type User = {
    login: string;
    password?: string; // Only stored temporarily during registration, not ideal in real app
    name: string;
    phone: string;
    email: string;
    isAdmin?: boolean;
};

// Mock Database
const mockProducts: Product[] = [
  { id: 1, name: 'Роза "Ред Наоми"', price: 150, imageUrl: '/placeholder.svg', description: 'Классическая красная роза с крупным бутоном.', category: 'flowers', country: 'Нидерланды', color: 'Красный', inStock: 50, isNew: true },
  { id: 2, name: 'Букет "Нежность"', price: 2500, imageUrl: '/placeholder.svg', description: 'Нежный букет из розовых роз и эустомы.', category: 'bouquets', country: 'Россия', color: 'Розовый', inStock: 15, isNew: true },
  { id: 3, name: 'Тюльпан "Стронг Голд"', price: 80, imageUrl: '/placeholder.svg', description: 'Ярко-желтый тюльпан.', category: 'flowers', country: 'Нидерланды', color: 'Желтый', inStock: 100, isNew: false },
  { id: 4, name: 'Упаковка крафт', price: 100, imageUrl: '/placeholder.svg', description: 'Экологичная крафтовая бумага.', category: 'packaging', country: 'Россия', color: 'Коричневый', inStock: 200, isNew: false },
  { id: 5, name: 'Букет "Весенний Бриз"', price: 3200, imageUrl: '/placeholder.svg', description: 'Яркий микс весенних цветов.', category: 'bouquets', country: 'Россия', color: 'Разноцветный', inStock: 10, isNew: true },
  { id: 6, name: 'Лента атласная', price: 50, imageUrl: '/placeholder.svg', description: 'Атласная лента для декора.', category: 'packaging', country: 'Китай', color: 'Фиолетовый', inStock: 150, isNew: false },
   { id: 7, name: 'Хризантема "Баккарди"', price: 120, imageUrl: '/placeholder.svg', description: 'Белая кустовая хризантема.', category: 'flowers', country: 'Нидерланды', color: 'Белый', inStock: 80, isNew: false },
];

const mockUsers: User[] = [
    { login: 'admin', password: 'admin', name: 'Admin', phone: '+7(000)-000-00-00', email: 'admin@example.com', isAdmin: true },
];

const mockOrders: Order[] = [
    { id: 1, userId: 'testuser', timestamp: Date.now() - 86400000, customerName: 'Иван Иванов', phone: '+7(999)-111-22-33', address: 'ул. Цветочная, д. 1', deliveryDate: '2024-06-10', deliveryTime: '12:00', paymentType: 'card', items: [{ productId: 2, quantity: 1, price: 2500 }], totalCost: 2500, status: 'confirmed' },
    { id: 2, userId: 'testuser', timestamp: Date.now() - 3600000, customerName: 'Иван Иванов', phone: '+7(999)-111-22-33', address: 'ул. Цветочная, д. 1', deliveryDate: '2024-06-12', deliveryTime: '15:00', paymentType: 'cash', items: [{ productId: 1, quantity: 5, price: 150 }, { productId: 4, quantity: 1, price: 100 }], totalCost: 850, status: 'new' },
];

// --- Reusable Components ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = 'font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105';
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  const variantStyles = {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white focus:ring-violet-500',
    secondary: 'bg-pink-500 hover:bg-pink-600 text-white focus:ring-pink-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300 focus:ring-gray-300',
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        className={`block w-full px-3 py-2 border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600 animate-pulse">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, id, error, options, className = '', ...props }) => {
    return (
        <div className={`w-full ${className}`}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            <select
                id={id}
                className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white`}
                {...props}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-red-600 animate-pulse">{error}</p>}
        </div>
    );
};


// --- Page Components ---

interface HeaderProps {
  onNavigate: (page: string) => void;
  cartItemCount: number;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, cartItemCount, isLoggedIn, isAdmin, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-2xl font-bold text-violet-600 cursor-pointer" onClick={() => handleNavigate('home')}>
          Мир Цветов
        </div>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('catalog'); }} className="text-gray-700 hover:text-pink-500 transition-colors">Каталог</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('cart'); }} className="relative text-gray-700 hover:text-pink-500 transition-colors">
            Корзина
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </a>
          {isLoggedIn ? (
            <>
              <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('profile'); }} className="text-gray-700 hover:text-pink-500 transition-colors">Личный кабинет</a>
              {isAdmin && <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('admin'); }} className="text-gray-700 hover:text-pink-500 transition-colors">Админ</a>}
              <Button size="sm" variant="secondary" onClick={onLogout}>Выход</Button>
            </>
          ) : (
            <Button size="sm" variant="primary" onClick={() => handleNavigate('auth')}>Вход/Регистрация</Button>
          )}
        </div>
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-700 focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </nav>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 animate-fade-in-down z-40">
            <div className="flex flex-col items-center py-4 space-y-3">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('catalog'); }} className="block py-2 px-4 text-gray-700 hover:bg-green-100 w-full text-center">Каталог</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('cart'); }} className="relative block py-2 px-4 text-gray-700 hover:bg-green-100 w-full text-center">
                    Корзина
                    {cartItemCount > 0 && (
                        <span className="absolute top-1 right-10 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount}
                        </span>
                    )}
                </a>
                 {isLoggedIn ? (
                    <>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('profile'); }} className="block py-2 px-4 text-gray-700 hover:bg-green-100 w-full text-center">Личный кабинет</a>
                        {isAdmin && <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('admin'); }} className="block py-2 px-4 text-gray-700 hover:bg-green-100 w-full text-center">Админ</a>}
                        <Button className="w-3/4" size="sm" variant="secondary" onClick={onLogout}>Выход</Button>
                    </>
                ) : (
                    <Button className="w-3/4" size="sm" variant="primary" onClick={() => handleNavigate('auth')}>Вход/Регистрация</Button>
                )}
            </div>
        </div>
      )}
    </header>
  );
};

const HomePage: React.FC = () => {
  return (
    <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-green-100 via-white to-lavender-100 p-4 animate-fade-in">
      <div className="text-center bg-white p-10 rounded-lg shadow-xl max-w-2xl mx-auto">
        <div className="w-40 h-40 mx-auto mb-6 bg-pink-200 border-4 border-dashed border-pink-400 rounded-full flex items-center justify-center text-6xl">🌸</div>
        <h1 className="text-4xl md:text-5xl font-bold text-violet-700 mb-4">Мир Цветов</h1>
        <p className="text-lg text-gray-600">Доставка свежих цветов по всему городу</p>
      </div>
    </div>
  );
};

interface ProductCardProps {
    product: Product;
    onAddToCart: (productId: number) => void;
    onViewDetails: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col animate-fade-in-up">
             <div className="w-full h-48 bg-gray-200 border-2 border-dashed rounded-t-lg flex items-center justify-center cursor-pointer" onClick={() => onViewDetails(product)}>
                {/* Placeholder for image */}
                <span className="text-gray-500">Изображение</span>
             </div>
             <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 cursor-pointer hover:text-violet-600" onClick={() => onViewDetails(product)}>{product.name}</h3>
                <p className="text-xl font-bold text-pink-600 mb-3">{product.price} ₽</p>
                <p className="text-sm text-gray-500 mb-3">В наличии: {product.inStock}</p>
                <Button
                    onClick={() => onAddToCart(product.id)}
                    disabled={product.inStock <= 0}
                    className="mt-auto w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   {product.inStock > 0 ? "Добавить в корзину" : "Нет в наличии"}
                </Button>
             </div>
        </div>
    );
};

interface CatalogPageProps {
  products: Product[];
  onAddToCart: (productId: number) => void;
  onViewDetails: (product: Product) => void;
}

const CatalogPage: React.FC<CatalogPageProps> = ({ products: initialProducts, onAddToCart, onViewDetails }) => {
    const [sortBy, setSortBy] = useState<'new' | 'country' | 'name' | 'price_asc' | 'price_desc'>('new');
    const [filterCategory, setFilterCategory] = useState<'all' | 'flowers' | 'bouquets' | 'packaging'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = initialProducts.filter(p => p.inStock > 0); // Only show in-stock items

        if (filterCategory !== 'all') {
            filtered = filtered.filter(p => p.category === filterCategory);
        }

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name': return a.name.localeCompare(b.name);
                case 'country': return a.country.localeCompare(b.country);
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'new':
                default: return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.id - a.id; // Newest first, then by ID
            }
        });
    }, [initialProducts, sortBy, filterCategory]);

    const FilterPanel = () => (
         <div className="space-y-4 p-4 bg-white rounded-lg shadow md:bg-transparent md:shadow-none md:p-0">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Фильтры</h3>
            <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <select
                    id="category-filter"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                >
                    <option value="all">Все</option>
                    <option value="flowers">Цветы</option>
                    <option value="bouquets">Букеты</option>
                    <option value="packaging">Упаковка</option>
                </select>
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-3 text-gray-800">Сортировка</h3>
            <div>
                <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-1">Сортировать по</label>
                <select
                    id="sort-filter"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                >
                    <option value="new">Новизне</option>
                    <option value="name">Наименованию (А-Я)</option>
                    <option value="country">Стране поставщика</option>
                    <option value="price_asc">Цене (по возрастанию)</option>
                    <option value="price_desc">Цене (по убыванию)</option>
                </select>
            </div>
            <button onClick={() => setShowFilters(false)} className="mt-4 text-sm text-violet-600 hover:underline md:hidden">
                Применить и закрыть
            </button>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
            {/* Mobile Filter Button */}
            <div className="md:hidden mb-4">
                 <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="w-full">
                    {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
                </Button>
            </div>

            {/* Filters Sidebar/Modal */}
             <aside className={`w-full md:w-1/4 lg:w-1/5 transition-all duration-300 ease-in-out ${showFilters ? 'block animate-fade-in-down' : 'hidden'} md:block`}>
                 <FilterPanel />
             </aside>

             {/* Product Grid */}
             <main className="w-full md:w-3/4 lg:w-4/5">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredAndSortedProducts.length > 0 ? (
                        filteredAndSortedProducts.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onViewDetails={onViewDetails} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">Товары не найдены.</p>
                    )}
                </div>
             </main>
        </div>
    );
};

interface ProductPageProps {
  product: Product;
  onAddToCart: (productId: number, quantity: number) => void;
  onBack: () => void;
}

const ProductPage: React.FC<ProductPageProps> = ({ product, onAddToCart, onBack }) => {
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const handleAddToCartClick = () => {
        if (quantity > product.inStock) {
            setError(`Максимально доступное количество: ${product.inStock}`);
            return;
        }
         if (quantity <= 0) {
            setError(`Количество должно быть больше нуля.`);
            return;
        }
        setError(null);
        onAddToCart(product.id, quantity);
    };

    const handleQuantityChange = (amount: number) => {
        const newQuantity = quantity + amount;
        if (newQuantity >= 1) {
             setQuantity(newQuantity);
             if (newQuantity > product.inStock) {
                 setError(`Максимально доступное количество: ${product.inStock}`);
             } else {
                 setError(null);
             }
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <Button onClick={onBack} variant="ghost" size="sm" className="mb-6">&larr; Назад в каталог</Button>
            <div className="flex flex-col md:flex-row gap-8 bg-white p-6 rounded-lg shadow-lg">
                {/* Image */}
                <div className="w-full md:w-1/2">
                     <div className="w-full h-96 bg-gray-200 border-2 border-dashed rounded-lg flex items-center justify-center">
                         <span className="text-gray-500">Изображение {product.name}</span>
                    </div>
                </div>
                {/* Details */}
                <div className="w-full md:w-1/2 flex flex-col">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">{product.name}</h1>
                    <p className="text-3xl font-bold text-pink-600 mb-5">{product.price} ₽</p>
                    <p className="text-gray-700 mb-5">{product.description}</p>
                    <div className="space-y-2 text-sm text-gray-600 mb-6">
                        <p><span className="font-semibold">Категория:</span> {product.category === 'bouquets' ? 'Букет' : product.category === 'flowers' ? 'Цветок' : 'Упаковка'}</p>
                        <p><span className="font-semibold">Страна-производитель:</span> {product.country}</p>
                        <p><span className="font-semibold">Цвет:</span> {product.color}</p>
                        <p><span className="font-semibold">В наличии:</span> <span className={product.inStock > 0 ? 'text-green-600' : 'text-red-600'}>{product.inStock} шт.</span></p>
                    </div>

                    {/* Add to Cart Section */}
                    {product.inStock > 0 ? (
                        <div className="mt-auto pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-4 mb-4">
                                <span className="text-gray-700">Количество:</span>
                                <div className="flex items-center border border-gray-300 rounded">
                                    <button onClick={() => handleQuantityChange(-1)} className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-l">-</button>
                                    <span className="px-4 py-1 border-l border-r border-gray-300">{quantity}</span>
                                    <button onClick={() => handleQuantityChange(1)} className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-r">+</button>
                                </div>
                            </div>
                             {error && <p className="text-red-600 text-sm mb-3 animate-pulse">{error}</p>}
                             <Button
                                 onClick={handleAddToCartClick}
                                 size="lg"
                                 className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                             >
                                 Добавить в корзину
                             </Button>
                        </div>
                     ) : (
                         <p className="mt-auto pt-4 border-t border-gray-200 text-red-600 font-semibold">Товар временно отсутствует</p>
                     )}
                </div>
            </div>
        </div>
    );
};


interface AuthPageProps {
  onLogin: (login: string, pass: string) => string | null; // Returns error or null
  onRegister: (user: User) => string | null; // Returns error or null
  onNavigate: (page: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onRegister, onNavigate }) => {
    const [isLoginView, setIsLoginView] = useState(true);

    // Login State
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);

    // Register State
    const [regLogin, setRegLogin] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regConfirmPassword, setRegConfirmPassword] = useState('');
    const [regName, setRegName] = useState('');
    const [regPhone, setRegPhone] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regErrors, setRegErrors] = useState<Record<string, string>>({});

    const validatePhone = (phone: string): boolean => /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/.test(phone);
    const validateName = (name: string): boolean => /^[А-Яа-яЁё\s-]+$/.test(name); // Cyrillic, spaces, hyphens
    const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        const error = onLogin(login, password);
        if (error) {
            setLoginError(error);
        } else {
            onNavigate('profile'); // Redirect to profile after login
        }
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!regLogin.trim()) errors.login = 'Логин обязателен';
        if (regPassword.length < 6) errors.password = 'Пароль должен быть не менее 6 символов';
        if (regPassword !== regConfirmPassword) errors.confirmPassword = 'Пароли не совпадают';
        if (!regName.trim()) errors.name = 'ФИО обязательно';
        else if (!validateName(regName)) errors.name = 'ФИО должно содержать только кириллицу, пробелы и дефисы';
        if (!regPhone.trim()) errors.phone = 'Номер телефона обязателен';
        else if (!validatePhone(regPhone)) errors.phone = 'Неверный формат телефона (+7(XXX)-XXX-XX-XX)';
        if (!regEmail.trim()) errors.email = 'Email обязателен';
        else if (!validateEmail(regEmail)) errors.email = 'Неверный формат Email';

        setRegErrors(errors);

        if (Object.keys(errors).length === 0) {
             const newUser: User = { login: regLogin, password: regPassword, name: regName, phone: regPhone, email: regEmail };
             const error = onRegister(newUser);
             if(error) {
                 setRegErrors({ form: error });
             } else {
                onNavigate('profile'); // Redirect after successful registration
             }
        }
    };

    return (
         <div className="flex-grow flex items-center justify-center p-4 bg-gradient-to-br from-lavender-100 via-white to-green-100 animate-fade-in">
             <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl">
                 <div className="flex justify-center mb-6 border-b border-gray-200">
                     <button
                        onClick={() => setIsLoginView(true)}
                        className={`px-6 py-3 font-semibold ${isLoginView ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                         Вход
                     </button>
                     <button
                        onClick={() => setIsLoginView(false)}
                        className={`px-6 py-3 font-semibold ${!isLoginView ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                     >
                         Регистрация
                     </button>
                 </div>

                 {isLoginView ? (
                     <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Авторизация</h2>
                         <Input
                             label="Логин"
                             id="login-login"
                             type="text"
                             value={login}
                             onChange={(e) => setLogin(e.target.value)}
                             required
                             error={loginError === 'Неверный логин' ? loginError : undefined}
                         />
                         <Input
                             label="Пароль"
                             id="login-password"
                             type="password"
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             required
                             error={loginError === 'Неверный пароль' ? loginError : undefined}
                         />
                         {loginError && loginError !== 'Неверный логин' && loginError !== 'Неверный пароль' && (
                             <p className="text-sm text-red-600 text-center animate-pulse">{loginError}</p>
                         )}
                         <Button type="submit" className="w-full" size="lg">Войти</Button>
                     </form>
                 ) : (
                     <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-fade-in">
                         <h2 className="text-2xl font-bold text-center text-gray-800 mb-5">Регистрация</h2>
                         <Input label="Логин*" id="reg-login" value={regLogin} onChange={(e) => setRegLogin(e.target.value)} error={regErrors.login} required />
                         <Input label="Пароль (мин. 6 симв.)*" id="reg-password" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} error={regErrors.password} required />
                         <Input label="Подтвердите пароль*" id="reg-confirm-password" type="password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} error={regErrors.confirmPassword} required />
                         <Input label="ФИО (кириллица)*" id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} error={regErrors.name} required />
                         <Input label="Телефон (+7(XXX)-XXX-XX-XX)*" id="reg-phone" type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+7(123)-456-78-90" error={regErrors.phone} required />
                         <Input label="Email*" id="reg-email" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} error={regErrors.email} required />

                         {regErrors.form && (
                             <p className="text-sm text-red-600 text-center animate-pulse">{regErrors.form}</p>
                         )}

                         <Button type="submit" className="w-full !mt-6" size="lg">Зарегистрироваться</Button>
                     </form>
                 )}
            </div>
        </div>
    );
};


interface CartPageProps {
  cart: CartItem[];
  products: Product[];
  onUpdateQuantity: (productId: number, newQuantity: number) => string | null; // Returns error or null
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
}

const CartPage: React.FC<CartPageProps> = ({ cart, products, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const [errors, setErrors] = useState<Record<number, string>>({}); // productId -> error message

  const getProductDetails = (productId: number): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const handleQuantityChange = (productId: number, change: number) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    const newQuantity = item.quantity + change;
    if (newQuantity >= 1) {
      const error = onUpdateQuantity(productId, newQuantity);
      setErrors(prev => ({ ...prev, [productId]: error ?? '' }));
    } else if (newQuantity === 0) {
      // Optionally ask for confirmation before removing
       onRemoveItem(productId);
       setErrors(prev => ({ ...prev, [productId]: '' }));
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = getProductDetails(item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cart, products]);


  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Корзина</h1>
      {cart.length === 0 ? (
        <p className="text-center text-gray-500">Ваша корзина пуста.</p>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {/* Cart Items Table */}
          <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Товар</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Цена</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Количество</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Сумма</th>
                    <th className="py-3 px-4"></th> {/* Actions */}
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => {
                    const product = getProductDetails(item.productId);
                    if (!product) return null; // Should not happen in real app
                    const itemError = errors[item.productId];
                    return (
                      <tr key={item.productId} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                        <td className="py-4 px-4 flex items-center space-x-3">
                          <div className="w-16 h-16 bg-gray-200 border-2 border-dashed rounded-md flex-shrink-0"></div>
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                             {itemError && <p className="text-xs text-red-600 animate-pulse">{itemError}</p>}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{product.price} ₽</td>
                        <td className="py-4 px-4">
                           <div className="flex items-center justify-center border border-gray-300 rounded w-fit mx-auto">
                                <button onClick={() => handleQuantityChange(item.productId, -1)} className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-l">-</button>
                                <span className="px-4 py-1 border-l border-r border-gray-300 min-w-[40px] text-center">{item.quantity}</span>
                                <button onClick={() => handleQuantityChange(item.productId, 1)} className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-r">+</button>
                            </div>
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-800">{(product.price * item.quantity)} ₽</td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="danger" size="sm" onClick={() => onRemoveItem(item.productId)}>Удалить</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>

          {/* Cart Summary & Checkout */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="text-lg font-semibold text-gray-800 mb-4 md:mb-0">
              Общая стоимость: <span className="text-2xl font-bold text-pink-600">{cartTotal} ₽</span>
            </div>
            <Button size="lg" onClick={onCheckout} className="w-full md:w-auto" disabled={Object.values(errors).some(e => !!e)}>
                Оформить заказ
            </Button>
          </div>
          {Object.values(errors).some(e => !!e) && <p className="text-red-600 text-sm mt-2 text-right">Исправьте ошибки в количестве товаров.</p>}
        </div>
      )}
    </div>
  );
};

interface CheckoutPageProps {
    user: User | null;
    cart: CartItem[];
    products: Product[];
    onSubmitOrder: (orderDetails: Omit<Order, 'id' | 'timestamp' | 'status' | 'userId' | 'items' | 'totalCost'>) => void;
    onBackToCart: () => void;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ user, cart, products, onSubmitOrder, onBackToCart }) => {
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [paymentType, setPaymentType] = useState<'cash' | 'card'>('card');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validatePhone = (phone: string): boolean => /^\+7\(\d{3}\)-\d{3}-\d{2}-\d{2}$/.test(phone);

     const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => {
          const product = products.find(p => p.id === item.productId);
          return total + (product ? product.price * item.quantity : 0);
        }, 0);
      }, [cart, products]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!address.trim()) newErrors.address = 'Адрес обязателен';
        if (!phone.trim()) newErrors.phone = 'Телефон обязателен';
        else if (!validatePhone(phone)) newErrors.phone = 'Неверный формат телефона (+7(XXX)-XXX-XX-XX)';
        if (!deliveryDate) newErrors.date = 'Дата доставки обязательна';
        if (!deliveryTime) newErrors.time = 'Время доставки обязательно';

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0 && user) {
            onSubmitOrder({
                customerName: user.name,
                phone,
                address,
                deliveryDate,
                deliveryTime,
                paymentType
            });
        } else if (!user) {
            // This shouldn't happen if checkout is protected
             setErrors(prev => ({...prev, form: 'Пожалуйста, войдите в систему для оформления заказа.'}));
        }
    };

    if (!user) {
         // Or redirect to login
        return <p className="container mx-auto px-4 py-8 text-center text-red-600">Пожалуйста, войдите в систему.</p>;
    }
     if (cart.length === 0) {
        return <p className="container mx-auto px-4 py-8 text-center text-gray-500">Ваша корзина пуста. Нечего оформлять.</p>;
    }


    return (
         <div className="container mx-auto px-4 py-8 animate-fade-in">
            <Button onClick={onBackToCart} variant="ghost" size="sm" className="mb-6">&larr; Назад в корзину</Button>
             <h1 className="text-3xl font-bold text-gray-800 mb-6">Оформление заказа</h1>
             <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg shadow-lg space-y-6 max-w-2xl mx-auto">
                 <div>
                     <h2 className="text-xl font-semibold text-gray-700 mb-3">Контактная информация</h2>
                     <p><strong>ФИО:</strong> {user.name}</p>
                     <Input
                        label="Телефон*"
                        id="checkout-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                        placeholder="+7(123)-456-78-90"
                        required
                     />
                 </div>

                 <div>
                     <h2 className="text-xl font-semibold text-gray-700 mb-3">Адрес доставки</h2>
                     <Input
                        label="Адрес*"
                        id="checkout-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        error={errors.address}
                        placeholder="Город, улица, дом, квартира"
                        required
                     />
                 </div>

                 <div>
                     <h2 className="text-xl font-semibold text-gray-700 mb-3">Дата и время получения</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input
                            label="Дата*"
                            id="checkout-date"
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            error={errors.date}
                            required
                            min={new Date().toISOString().split('T')[0]} // Set min date to today
                         />
                         <Input
                            label="Время*"
                            id="checkout-time"
                            type="time"
                            value={deliveryTime}
                            onChange={(e) => setDeliveryTime(e.target.value)}
                            error={errors.time}
                            required
                         />
                     </div>
                 </div>

                  <div>
                     <h2 className="text-xl font-semibold text-gray-700 mb-3">Способ оплаты</h2>
                     <Select
                        label="Выберите способ оплаты*"
                        id="checkout-payment"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value as 'cash' | 'card')}
                        options={[
                            { value: 'card', label: 'Банковская карта (онлайн/курьеру)' },
                            { value: 'cash', label: 'Наличные (курьеру)' },
                        ]}
                        required
                     />
                 </div>

                 <div className="pt-6 border-t border-gray-200">
                    <p className="text-lg font-semibold text-right mb-4">Итого к оплате: <span className="text-2xl font-bold text-pink-600">{cartTotal} ₽</span></p>
                    {errors.form && <p className="text-sm text-red-600 text-center mb-4 animate-pulse">{errors.form}</p>}
                    <Button type="submit" size="lg" className="w-full">Подтвердить заказ</Button>
                 </div>

             </form>
        </div>
    );
};

interface OrderSuccessPageProps {
    orderId: number;
    onNavigateHome: () => void;
}

const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({ orderId, onNavigateHome }) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown === 0) {
            onNavigateHome();
            return;
        }
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, onNavigateHome]);

    return (
         <div className="flex-grow flex items-center justify-center p-4 bg-gradient-to-br from-green-100 via-white to-lavender-100 animate-fade-in">
             <div className="text-center bg-white p-10 rounded-lg shadow-xl max-w-lg mx-auto">
                 <div className="w-20 h-20 mx-auto mb-6 bg-green-200 border-4 border-dashed border-green-400 rounded-full flex items-center justify-center text-4xl">
                    🎉
                 </div>
                 <h1 className="text-3xl font-bold text-green-700 mb-4">Заказ успешно оформлен!</h1>
                 <p className="text-lg text-gray-600 mb-2">Номер вашего заказа: <strong className="text-violet-600">#{orderId}</strong></p>
                 <p className="text-gray-500 mb-6">Спасибо за покупку в "Мир Цветов"!</p>
                  <p className="text-sm text-gray-500">
                      Вы будете перенаправлены на главную страницу через{' '}
                      <span key={countdown} className="font-bold text-xl text-pink-500 animate-ping-pong">{countdown}</span>...
                 </p>
                 <Button onClick={onNavigateHome} variant="ghost" className="mt-6">На главную</Button>
             </div>
         </div>
    );
};


interface ProfilePageProps {
  user: User;
  orders: Order[];
  products: Product[];
  onDeleteOrder: (orderId: number) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, orders, products, onDeleteOrder }) => {

    const getStatusText = (status: Order['status']) => {
        switch (status) {
            case 'new': return <span className="text-blue-600 font-medium">Новый</span>;
            case 'processing': return <span className="text-yellow-600 font-medium">В работе</span>;
            case 'confirmed': return <span className="text-green-600 font-medium">Подтверждён</span>;
            case 'cancelled': return <span className="text-red-600 font-medium">Отменён</span>;
            default: return <span className="text-gray-500">Неизвестно</span>;
        }
    };

     const getProductDetails = (productId: number): Product | undefined => {
        return products.find(p => p.id === productId);
    };

    const userOrders = useMemo(() => {
        return orders
            .filter(o => o.userId === user.login)
            .sort((a, b) => b.timestamp - a.timestamp); // Newest first
    }, [orders, user.login]);

    return (
        <div className="container mx-auto px-4 py-8 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Личный кабинет</h1>
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-3">Данные пользователя</h2>
                <p><strong>Логин:</strong> {user.login}</p>
                <p><strong>ФИО:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Телефон:</strong> {user.phone}</p>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">История заказов</h2>
            {userOrders.length === 0 ? (
                <p className="text-center text-gray-500">У вас еще нет заказов.</p>
            ) : (
                <div className="space-y-6">
                    {userOrders.map(order => (
                        <div key={order.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
                            <div className="flex flex-wrap justify-between items-center mb-3 pb-3 border-b border-gray-200">
                                <div>
                                     <p className="text-lg font-semibold text-violet-700">Заказ #{order.id}</p>
                                     <p className="text-sm text-gray-500">Дата: {new Date(order.timestamp).toLocaleDateString()} {new Date(order.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="text-right mt-2 sm:mt-0">
                                    <p className="text-lg font-semibold">{getStatusText(order.status)}</p>
                                    <p className="text-lg font-bold text-pink-600">{order.totalCost} ₽</p>
                                </div>
                            </div>
                            <div className="mb-4">
                                 <h4 className="font-semibold text-gray-700 mb-2">Детали заказа:</h4>
                                 <p className="text-sm text-gray-600"><strong>Адрес:</strong> {order.address}</p>
                                 <p className="text-sm text-gray-600"><strong>Доставка:</strong> {order.deliveryDate} в {order.deliveryTime}</p>
                                 <p className="text-sm text-gray-600"><strong>Оплата:</strong> {order.paymentType === 'cash' ? 'Наличными' : 'Картой'}</p>
                                 {order.status === 'cancelled' && order.cancelReason && <p className="text-sm text-red-500"><strong>Причина отмены:</strong> {order.cancelReason}</p>}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Товары:</h4>
                                <ul className="space-y-1 list-disc list-inside text-sm text-gray-600">
                                    {order.items.map((item, index) => {
                                        const product = getProductDetails(item.productId);
                                        return (
                                            <li key={index}>
                                                {product?.name ?? `Товар ID: ${item.productId}`} - {item.quantity} шт. x {item.price} ₽
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            {order.status === 'new' && (
                                <div className="mt-4 text-right">
                                    <Button variant="danger" size="sm" onClick={() => onDeleteOrder(order.id)}>
                                        Удалить заказ
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


interface AdminPageProps {
    orders: Order[];
    onChangeStatus: (orderId: number, newStatus: Order['status'], reason?: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ orders: initialOrders, onChangeStatus }) => {
    const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'processing' | 'confirmed' | 'cancelled'>('all');
    const [cancelReasonInput, setCancelReasonInput] = useState<Record<number, string>>({}); // orderId -> reason
    const [showCancelInput, setShowCancelInput] = useState<number | null>(null); // orderId to show input for

    const filteredOrders = useMemo(() => {
        let filtered = [...initialOrders].sort((a, b) => b.timestamp - a.timestamp); // Newest first
        if (filterStatus !== 'all') {
            filtered = filtered.filter(o => o.status === filterStatus);
        }
        return filtered;
    }, [initialOrders, filterStatus]);

    const handleStatusChange = (orderId: number, newStatus: Order['status']) => {
        if (newStatus === 'cancelled') {
             // If cancelling, first show the reason input field
             if (showCancelInput === orderId) {
                 // If input is already shown, proceed with cancellation
                 const reason = cancelReasonInput[orderId] || 'Причина не указана';
                 onChangeStatus(orderId, newStatus, reason);
                 setShowCancelInput(null); // Hide input after confirmation
                 setCancelReasonInput(prev => ({...prev, [orderId]: ''})); // Clear reason
             } else {
                 setShowCancelInput(orderId); // Show input
             }
        } else {
            // For other statuses, change immediately
            onChangeStatus(orderId, newStatus);
            setShowCancelInput(null); // Ensure cancel input is hidden if another status is chosen
        }
    };

     const getStatusText = (status: Order['status'], compact = false) => {
        switch (status) {
            case 'new': return compact ? 'Нов.' : 'Новый';
            case 'processing': return compact ? 'В раб.' : 'В работе';
            case 'confirmed': return compact ? 'Подтв.' : 'Подтверждён';
            case 'cancelled': return compact ? 'Отм.' : 'Отменён';
            default: return compact ? '?' : 'Неизвестно';
        }
    };
     const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'new': return 'text-blue-600';
            case 'processing': return 'text-yellow-600';
            case 'confirmed': return 'text-green-600';
            case 'cancelled': return 'text-red-600';
            default: return 'text-gray-500';
        }
    };


    return (
         <div className="container mx-auto px-4 py-8 animate-fade-in">
             <h1 className="text-3xl font-bold text-gray-800 mb-6">Панель администратора - Заказы</h1>

             {/* Filter Controls */}
             <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                 <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Фильтр по статусу:</label>
                 <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                 >
                     <option value="all">Все заказы</option>
                     <option value="new">Новые</option>
                     <option value="processing">В работе</option>
                     <option value="confirmed">Подтвержденные</option>
                     <option value="cancelled">Отмененные</option>
                 </select>
             </div>

             {/* Orders Table */}
             <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
                 <table className="w-full min-w-[900px]">
                     <thead className="bg-gray-50 border-b border-gray-200">
                         <tr>
                             <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ID</th>
                             <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Дата</th>
                             <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Заказчик</th>
                             <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Контакты</th>
                             <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">Товары</th>
                             <th className="text-right py-3 px-4 font-semibold text-gray-600 text-sm">Сумма</th>
                             <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Статус</th>
                             <th className="text-center py-3 px-4 font-semibold text-gray-600 text-sm">Действия</th>
                         </tr>
                     </thead>
                     <tbody>
                         {filteredOrders.length === 0 ? (
                             <tr>
                                 <td colSpan={8} className="text-center py-10 text-gray-500">Заказы с таким статусом не найдены.</td>
                             </tr>
                         ) : (
                             filteredOrders.map(order => (
                                 <tr key={order.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                                     <td className="py-3 px-4 text-sm text-gray-700 font-medium">#{order.id}</td>
                                     <td className="py-3 px-4 text-sm text-gray-500">{new Date(order.timestamp).toLocaleString()}</td>
                                     <td className="py-3 px-4 text-sm text-gray-800">{order.customerName}</td>
                                     <td className="py-3 px-4 text-sm text-gray-500">{order.phone}<br />{order.address}</td>
                                     <td className="py-3 px-4 text-sm text-gray-500">{order.items.reduce((sum, i) => sum + i.quantity, 0)} шт.</td>
                                     <td className="py-3 px-4 text-sm text-right font-semibold text-pink-600">{order.totalCost} ₽</td>
                                     <td className={`py-3 px-4 text-sm text-center font-medium ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</td>
                                     <td className="py-3 px-4 text-center space-x-1">
                                         {order.status !== 'processing' && <Button size="sm" variant="ghost" className="text-yellow-600 border-yellow-400 hover:bg-yellow-50" onClick={() => handleStatusChange(order.id, 'processing')}>В работу</Button>}
                                         {order.status !== 'confirmed' && <Button size="sm" variant="ghost" className="text-green-600 border-green-400 hover:bg-green-50" onClick={() => handleStatusChange(order.id, 'confirmed')}>Выполнено</Button>}
                                         {order.status !== 'cancelled' && (
                                            <>
                                                <Button size="sm" variant="danger" onClick={() => handleStatusChange(order.id, 'cancelled')}>
                                                    {showCancelInput === order.id ? 'Подтв. отмену' : 'Отменить'}
                                                </Button>
                                                {showCancelInput === order.id && (
                                                    <div className="mt-2 animate-fade-in">
                                                        <input
                                                            type="text"
                                                            placeholder="Причина отмены (необязательно)"
                                                            value={cancelReasonInput[order.id] || ''}
                                                            onChange={(e) => setCancelReasonInput(prev => ({ ...prev, [order.id]: e.target.value }))}
                                                            className="text-xs p-1 border rounded w-full"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                         )}
                                     </td>
                                 </tr>
                             ))
                         )}
                     </tbody>
                 </table>
             </div>
         </div>
    );
};

// --- Main App Component ---

export default function FlowerShopApp() {
  const [currentPage, setCurrentPage] = useState<string>('home'); // 'home', 'catalog', 'product', 'auth', 'cart', 'checkout', 'orderSuccess', 'profile', 'admin'
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [users, setUsers] = useState<User[]>(mockUsers); // Holds registered users
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null); // For success page


  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const handleLogin = (login: string, pass: string): string | null => {
        const user = users.find(u => u.login === login);
        if (!user) return 'Неверный логин';
        // In real app, compare hashed passwords
        if (user.password !== pass) return 'Неверный пароль';
        setLoggedInUser(user);
        return null; // Success
  };

   const handleRegister = (newUser: User): string | null => {
        if (users.some(u => u.login === newUser.login)) {
            return 'Пользователь с таким логином уже существует';
        }
         if (users.some(u => u.email === newUser.email)) {
            return 'Пользователь с таким email уже существует';
        }
        // Don't store plain password in real app state! This is just for the example.
        const userToSave: User = { ...newUser, isAdmin: false }; // Explicitly set isAdmin to false
        setUsers(prev => [...prev, userToSave]);
        setLoggedInUser(userToSave);
        return null; // Success
   };

  const handleLogout = () => {
    setLoggedInUser(null);
    handleNavigate('home');
  };

  const addToCart = (productId: number, quantity: number = 1): string | null => {
        const product = products.find(p => p.id === productId);
        if (!product) return "Товар не найден";

        const existingItem = cart.find(item => item.productId === productId);
        const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
        const requestedTotalQuantity = currentQuantityInCart + quantity;

        if (requestedTotalQuantity > product.inStock) {
             return `Недостаточно товара. В наличии: ${product.inStock}. В корзине уже: ${currentQuantityInCart}.`;
        }

        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === productId ? { ...item, quantity: requestedTotalQuantity } : item
            ));
        } else {
            setCart([...cart, { productId, quantity }]);
        }
        return null; // Success
  };

   const updateCartQuantity = (productId: number, newQuantity: number): string | null => {
        const product = products.find(p => p.id === productId);
        if (!product) return "Товар не найден"; // Should not happen

        if (newQuantity <= 0) {
            // Remove item if quantity is zero or less
            removeFromCart(productId);
            return null;
        }

         if (newQuantity > product.inStock) {
             // Set error message, but don't automatically change quantity back yet
             // Let the UI show the error next to the input/buttons
             return `Максимально доступное количество: ${product.inStock}`;
         }

        // Update quantity if valid
        setCart(cart.map(item =>
            item.productId === productId ? { ...item, quantity: newQuantity } : item
        ));
        return null; // Success or no change needed if quantity is the same
   };


  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

   const handleCheckout = () => {
        if (!loggedInUser) {
            handleNavigate('auth'); // Redirect to login if not logged in
            return;
        }
        if (cart.length === 0) {
           // Optionally show a message
           return;
        }
        // Check if all items have valid quantities (no errors from CartPage)
         let hasErrors = false;
         cart.forEach(item => {
             const product = products.find(p => p.id === item.productId);
             if (!product || item.quantity > product.inStock) {
                 hasErrors = true;
                 // Maybe highlight the item with the error in the cart again?
             }
         });

         if (hasErrors) {
             // Optionally show a general error message before navigating
             console.error("Cannot proceed to checkout, cart contains errors.");
             return;
         }

        handleNavigate('checkout');
   };

    const submitOrder = (orderDetails: Omit<Order, 'id' | 'timestamp' | 'status' | 'userId' | 'items' | 'totalCost'>) => {
        if (!loggedInUser || cart.length === 0) return;

        const newOrderId = (orders.length > 0 ? Math.max(...orders.map(o => o.id)) : 0) + 1;
        const orderItems = cart.map(cartItem => {
             const product = products.find(p => p.id === cartItem.productId);
             return {
                 productId: cartItem.productId,
                 quantity: cartItem.quantity,
                 price: product?.price ?? 0, // Store price at time of order
             };
        });
        const totalCost = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const newOrder: Order = {
            id: newOrderId,
            userId: loggedInUser.login,
            timestamp: Date.now(),
            ...orderDetails,
            items: orderItems,
            totalCost: totalCost,
            status: 'new',
        };

        // Update product stock (in real app, this should be transactional)
        const updatedProducts = products.map(p => {
            const itemInOrder = orderItems.find(item => item.productId === p.id);
            if (itemInOrder) {
                return { ...p, inStock: p.inStock - itemInOrder.quantity };
            }
            return p;
        });
        setProducts(updatedProducts);


        setOrders(prev => [...prev, newOrder]);
        setCart([]); // Clear cart
        setLastOrderId(newOrderId);
        handleNavigate('orderSuccess');
    };

    const handleDeleteOrder = (orderId: number) => {
        // Only allow deleting 'new' orders by the user who placed them
        const orderToDelete = orders.find(o => o.id === orderId && o.userId === loggedInUser?.login && o.status === 'new');
        if (orderToDelete) {
             // In a real app, you might just mark it as cancelled by user instead of deleting
            setOrders(prev => prev.filter(o => o.id !== orderId));
             // Note: Stock is NOT returned automatically here. Would need logic for that if required.
        } else {
            console.warn("Cannot delete order or order not found/not deletable.");
        }
    };


   const handleAdminChangeStatus = (orderId: number, newStatus: Order['status'], reason?: string) => {
        setOrders(prevOrders =>
            prevOrders.map(order => {
                if (order.id === orderId) {
                    const updatedOrder = { ...order, status: newStatus };
                    if (newStatus === 'cancelled') {
                        updatedOrder.cancelReason = reason;
                        // Add logic here to potentially return stock to inventory
                    }
                    return updatedOrder;
                }
                return order;
            })
        );
    };


  const handleViewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    handleNavigate('product');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'catalog':
        return <CatalogPage products={products} onAddToCart={addToCart} onViewDetails={handleViewProductDetails} />;
      case 'product':
        return selectedProduct ? <ProductPage product={selectedProduct} onAddToCart={addToCart} onBack={() => handleNavigate('catalog')} /> : <HomePage />; // Fallback to home if no product selected
      case 'auth':
        return <AuthPage onLogin={handleLogin} onRegister={handleRegister} onNavigate={handleNavigate} />;
      case 'cart':
        return <CartPage cart={cart} products={products} onUpdateQuantity={updateCartQuantity} onRemoveItem={removeFromCart} onCheckout={handleCheckout} />;
       case 'checkout':
         return <CheckoutPage user={loggedInUser} cart={cart} products={products} onSubmitOrder={submitOrder} onBackToCart={() => handleNavigate('cart')} />;
       case 'orderSuccess':
         return lastOrderId ? <OrderSuccessPage orderId={lastOrderId} onNavigateHome={() => handleNavigate('home')} /> : <HomePage />;
      case 'profile':
         return loggedInUser ? <ProfilePage user={loggedInUser} orders={orders} products={products} onDeleteOrder={handleDeleteOrder} /> : <AuthPage onLogin={handleLogin} onRegister={handleRegister} onNavigate={handleNavigate} />; // Redirect to auth if not logged in
      case 'admin':
         return loggedInUser?.isAdmin ? <AdminPage orders={orders} onChangeStatus={handleAdminChangeStatus} /> : <HomePage />; // Redirect to home if not admin
      case 'home':
      default:
        return <HomePage />;
    }
  };

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans">
       <style>
        {`
           @keyframes fade-in {
             from { opacity: 0; }
             to { opacity: 1; }
           }
           @keyframes fade-in-down {
             from { opacity: 0; transform: translateY(-10px); }
             to { opacity: 1; transform: translateY(0); }
           }
            @keyframes fade-in-up {
             from { opacity: 0; transform: translateY(10px); }
             to { opacity: 1; transform: translateY(0); }
           }
           @keyframes ping-pong {
             0%, 100% { transform: scale(1); opacity: 1; }
             50% { transform: scale(1.2); opacity: 0.7; }
           }
           .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
           .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
            .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
           .animate-ping-pong { animation: ping-pong 1s ease-in-out infinite; display: inline-block; } /* Added display inline-block */

           /* Basic scrollbar styling for webkit browsers */
            ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            ::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
                background: #c1c1c1; /* Light grey */
                border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
                 background: #a8a8a8; /* Darker grey on hover */
            }

            /* Define custom colors if needed (requires Tailwind config extension) */
            .bg-lavender-100 { background-color: #E6E6FA; } /* Example Lavender */
            .bg-beige-100 { background-color: #F5F5DC; } /* Example Beige */
         `}
       </style>
      <Header
        onNavigate={handleNavigate}
        cartItemCount={cartItemCount}
        isLoggedIn={!!loggedInUser}
        isAdmin={!!loggedInUser?.isAdmin}
        onLogout={handleLogout}
      />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <footer className="bg-gray-800 text-white py-6 mt-10">
        <div className="container mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} Мир Цветов. Все права защищены.
        </div>
      </footer>
    </div>
  );
}