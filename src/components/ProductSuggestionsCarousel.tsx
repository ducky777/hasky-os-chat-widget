'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductSuggestion, DynamicProductSuggestionsConfig } from '../types';

interface ProductSuggestionCardProps {
  product: Product;
  suggestedSize?: string;
  onAddToCart?: (product: Product, size?: string) => void;
  onImageClick?: (product: Product) => void;
}

function ProductSuggestionCard({
  product,
  suggestedSize,
  onAddToCart,
  onImageClick,
}: ProductSuggestionCardProps) {
  // Use suggested size if valid, otherwise fall back to first available size
  const validSuggestedSize = suggestedSize && product.sizes?.includes(suggestedSize)
    ? suggestedSize
    : product.sizes?.[0];
  const [selectedSize, setSelectedSize] = useState<string | undefined>(validSuggestedSize);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    if (!onAddToCart) return;
    setIsAdding(true);
    onAddToCart(product, selectedSize);

    setTimeout(() => {
      setIsAdding(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }, 300);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  const isOutOfStock = product.inStock === false;
  const currencySymbol = product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '\u20AC' : '$';

  return (
    <div className="pcm-product-card">
      <div
        className="pcm-product-image-wrap pcm-product-image-wrap--clickable"
        onClick={() => onImageClick?.(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onImageClick?.(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="pcm-product-image"
        />
        {hasDiscount && (
          <span className="pcm-product-badge">-{discountPercent}%</span>
        )}
        {isOutOfStock && (
          <span className="pcm-product-badge pcm-product-badge--out-of-stock">Out of Stock</span>
        )}
        <div className="pcm-product-view-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>View</span>
        </div>
      </div>
      <div className="pcm-product-info">
        <h4 className="pcm-product-name">{product.name}</h4>
        {(product.quantity || product.variant) && (
          <p className="pcm-product-meta">
            {product.variant}{product.variant && product.quantity ? ' \u00B7 ' : ''}{product.quantity}
          </p>
        )}
        <div className="pcm-product-price-row">
          <span className="pcm-product-price">{currencySymbol}{product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="pcm-product-original-price">
              {currencySymbol}{product.originalPrice!.toFixed(2)}
            </span>
          )}
        </div>
        {product.sizes && product.sizes.length > 1 && (
          <div className="pcm-product-sizes">
            {product.sizes.map((size) => (
              <button
                key={size}
                className={`pcm-size-btn ${selectedSize === size ? 'pcm-size-btn--active' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        )}
        {onAddToCart && (
          <button
            className={`pcm-add-to-cart-btn ${justAdded ? 'pcm-add-to-cart-btn--success' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdding || isOutOfStock}
          >
            {isAdding ? (
              <span className="pcm-cart-spinner" />
            ) : justAdded ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Added!
              </>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface ProductSuggestionsCarouselProps {
  suggestions: ProductSuggestion[];
  config: DynamicProductSuggestionsConfig;
}

export function ProductSuggestionsCarousel({
  suggestions,
  config,
}: ProductSuggestionsCarouselProps) {
  const [resolvedProducts, setResolvedProducts] = useState<{ product: Product; suggestedSize: string | undefined }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!suggestions.length) {
      setLoading(false);
      setResolvedProducts([]);
      return;
    }

    async function fetchProducts() {
      try {
        let allProducts: Product[] = [];

        // Prefer getProducts callback over API endpoint
        if (config.getProducts) {
          const products = await config.getProducts();
          allProducts = products || [];
        } else if (config.productsApiEndpoint) {
          const res = await fetch(config.productsApiEndpoint);
          const data = await res.json();
          allProducts = data.products || data || [];
        }

        const resolved = suggestions
          .map(s => {
            const product = allProducts.find(p => p.id === s.productId);
            return product ? { product, suggestedSize: s.suggestedSize } : null;
          })
          .filter((p): p is { product: Product; suggestedSize: string | undefined } => p !== null);

        setResolvedProducts(resolved);
      } catch (error) {
        console.error('Failed to fetch products for suggestions:', error);
        setResolvedProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [suggestions, config.productsApiEndpoint, config.getProducts]);

  if (loading || resolvedProducts.length === 0) return null;

  return (
    <div className="pcm-product-suggestions pcm-product-suggestions--ai">
      <div className="pcm-product-suggestions-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{config.headerText || 'Recommended for you'}</span>
      </div>
      <div className="pcm-product-carousel">
        {resolvedProducts.map(({ product, suggestedSize }) => (
          <ProductSuggestionCard
            key={product.id}
            product={product}
            suggestedSize={suggestedSize}
            onAddToCart={config.onAddToCart}
            onImageClick={config.onProductClick}
          />
        ))}
      </div>
    </div>
  );
}
