'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductSuggestionsConfig } from '../types';

interface FeaturedProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onImageClick?: (product: Product) => void;
}

function FeaturedProductCard({
  product,
  onAddToCart,
  onImageClick,
}: FeaturedProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    if (!onAddToCart) return;
    setIsAdding(true);
    onAddToCart(product);

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
        <div className="pcm-product-price-row">
          <span className="pcm-product-price">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="pcm-product-original-price">
              ${product.originalPrice!.toFixed(2)}
            </span>
          )}
        </div>
        {onAddToCart && (
          <button
            className={`pcm-add-to-cart-btn ${justAdded ? 'pcm-add-to-cart-btn--success' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdding}
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

interface FeaturedProductsCarouselProps {
  config: ProductSuggestionsConfig;
}

export function FeaturedProductsCarousel({ config }: FeaturedProductsCarouselProps) {
  const [products, setProducts] = useState<Product[]>(config.products || []);
  const [loading, setLoading] = useState(!config.products?.length && !!config.apiEndpoint);

  useEffect(() => {
    // If products are provided directly, use those
    if (config.products?.length) {
      setProducts(config.products);
      setLoading(false);
      return;
    }

    // Otherwise fetch from API if endpoint is provided
    if (!config.apiEndpoint) {
      setLoading(false);
      return;
    }

    async function fetchFeaturedProducts() {
      try {
        const res = await fetch(config.apiEndpoint!);
        const data = await res.json();
        setProducts(data.products || data || []);
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFeaturedProducts();
  }, [config.apiEndpoint, config.products]);

  if (loading || products.length === 0) return null;

  return (
    <div className="pcm-product-suggestions">
      <div className="pcm-product-suggestions-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>{config.headerText || 'Featured Products'}</span>
      </div>
      <div className="pcm-product-carousel">
        {products.map((product) => (
          <FeaturedProductCard
            key={product.id}
            product={product}
            onAddToCart={config.onAddToCart}
            onImageClick={config.onProductClick}
          />
        ))}
      </div>
    </div>
  );
}
