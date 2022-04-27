import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const handleGetStockAPI = async (productId: number): Promise<Stock> => {
    const response = await api.get<Stock>(`/stock/${productId}`)

    return response.data

  }

  const handleGetProductAPI = async (productId: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${productId}`)

    return response.data
  }

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]

      const productInCart = newCart.find(
        product => product.id === productId
      )

      const stock = await handleGetStockAPI(productId)
      const productAmount = productInCart ? productInCart.amount : 0
      const amount = productAmount + 1

      if (amount > stock.amount) {
        toast.error(
          'Quantidade solicitada fora de estoque'
        );
        return;
      }

      if (productInCart) {
        productInCart.amount = amount
      } else {
        const product = await handleGetProductAPI(
          productId
        )
        const newProduct = {
          ...product,
          amount: 1
        }
        newCart.push(newProduct)
      }

      setCart([...newCart])

      localStorage.setItem(
        '@RocketShoes:cart',
        JSON.stringify(newCart)
      )

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const index = newCart.findIndex(
        product => product.id === productId
      )

      if (index === -1) {
        throw new Error("Erro na remoção do produto");
      }

      newCart.splice(index, 1)

      setCart([...newCart])

      localStorage.setItem(
        '@RocketShoes:cart',
        JSON.stringify(newCart)
      )

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount < 1) {
        throw new Error("Erro na alteração de quantidade do produto");
      }

      const newCart = [...cart]

      const productInCart = newCart.find(
        product => product.id === productId
      )

      const stock = await handleGetStockAPI(productId)

      if (amount > stock.amount) {
        toast.error(
          'Quantidade solicitada fora de estoque'
        );
        return;
      }

      if (productInCart) {
        productInCart.amount = amount
      }

      setCart([...newCart])

      localStorage.setItem(
        '@RocketShoes:cart',
        JSON.stringify(newCart)
      )

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
