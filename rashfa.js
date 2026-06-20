  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getDatabase, ref, onValue, push, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

    const firebaseConfig = {
        apiKey: "AIzaSyARX12v1lvgKaFhIoYWRtv1Nqxpt8zz8HE",
        authDomain: "rashfa-9d95d.firebaseapp.com",
        databaseURL: "https://rashfa-9d95d-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "rashfa-9d95d",
        storageBucket: "rashfa-9d95d.firebasestorage.app",
        messagingSenderId: "973516999258",
        appId: "1:973516999258:web:e71f8d42efd8e461e0a663",
        measurementId: "G-8SL2SY7X49"
    };

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    let allProducts = [];
    let cartItems = [];
    let activeOrders = [];
    let orderTimers = {};

    // استعادة البيانات من localStorage
    const savedOrderIds = JSON.parse(localStorage.getItem('rashfa_active_order_ids') || '[]');
    const savedCart = localStorage.getItem('rashfa_temp_cart');

    if (savedCart) {
        try { cartItems = JSON.parse(savedCart); } catch (e) { cartItems = []; }
    }

    // تحميل الطلبات النشطة
    if (savedOrderIds.length > 0) {
        savedOrderIds.forEach(oid => fetchOrderDetails(oid));
    }

    function showToast(msg, type = '') {
        const old = document.querySelector('.toast-msg');
        if (old) old.remove();
        const t = document.createElement('div');
        t.className = 'toast-msg';
        if (type === 'success') t.classList.add('toast-success');
        if (type === 'error') t.classList.add('toast-error');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => {
            if (t.parentNode) t.remove();
        }, 2500);
    }

    function saveCartToStorage() {
        localStorage.setItem('rashfa_temp_cart', JSON.stringify(cartItems));
        updateCartBadge();
    }

    function saveOrderIdsToStorage() {
        const ids = activeOrders.filter(o => o.status !== 'delivered').map(o => o.orderId);
        localStorage.setItem('rashfa_active_order_ids', JSON.stringify(ids));
    }

    function updateCartBadge() {
        const count = cartItems.reduce((sum, i) => sum + i.quantity, 0);
        const badge = document.getElementById('navCartBadge');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('show', count > 0);
        }
    }

    function navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        if (page === 'home') {
            document.getElementById('homePage').classList.add('active');
            document.getElementById('navHomeBtn').classList.add('active');
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');
            if (searchInput) searchInput.value = '';
            if (searchClear) searchClear.classList.remove('visible');
            renderHomeProducts();
        } else {
            document.getElementById('cartPage').classList.add('active');
            document.getElementById('navCartBtn').classList.add('active');
            renderCartPage();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function fetchOrderDetails(orderId) {
        try {
            const snap = await get(ref(database, `orders/${orderId}`));
            if (snap.exists()) {
                const data = snap.val();
                activeOrders = activeOrders.filter(o => o.orderId !== orderId);
                activeOrders.push({
                    orderId,
                    status: data.status || 'pending',
                    items: data.items || [],
                    orderData: data
                });
                listenToOrderUpdates(orderId);
            } else {
                activeOrders = activeOrders.filter(o => o.orderId !== orderId);
            }
            saveOrderIdsToStorage();
        } catch (err) {
            console.error('خطأ في جلب الطلب:', err);
            activeOrders = activeOrders.filter(o => o.orderId !== orderId);
            saveOrderIdsToStorage();
        }
    }

    function listenToOrderUpdates(orderId) {
        const orderRef = ref(database, `orders/${orderId}`);
        onValue(orderRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                const idx = activeOrders.findIndex(o => o.orderId === orderId);
                if (idx >= 0) {
                    activeOrders[idx].status = data.status || 'pending';
                    activeOrders[idx].items = data.items || [];
                    activeOrders[idx].orderData = data;
                }
                saveOrderIdsToStorage();

                if (document.getElementById('cartPage').classList.contains('active')) {
                    renderCartPage();
                }

                if (data.status === 'delivered') {
                    if (orderTimers[orderId]) clearTimeout(orderTimers[orderId]);
                    orderTimers[orderId] = setTimeout(() => {
                        activeOrders = activeOrders.filter(o => o.orderId !== orderId);
                        saveOrderIdsToStorage();
                        delete orderTimers[orderId];
                        if (document.getElementById('cartPage').classList.contains('active')) {
                            renderCartPage();
                        }
                        showToast('✅ تم أرشفة الطلب');
                    }, 10 * 60 * 1000);
                }
            } else {
                activeOrders = activeOrders.filter(o => o.orderId !== orderId);
                saveOrderIdsToStorage();
                if (document.getElementById('cartPage').classList.contains('active')) renderCartPage();
            }
        });
    }

    function renderCartPage() {
        const container = document.getElementById('cartContainer');
        if (!container) return;
        
        let html = '';

        if (activeOrders.length > 0) {
            html += `<div class="cart-section">
                <div class="cart-section-title"><i class="fa-solid fa-list-check"></i> طلباتي (${activeOrders.length})</div>`;

            activeOrders.forEach(order => {
                const statusMap = {
                    'pending': { icon: '⏳', text: 'جاري قبول الطلب...', cls: 'badge-pending' },
                    'accepted': { icon: '✅', text: 'تم القبول - جاري التحضير', cls: 'badge-accepted' },
                    'delivering': { icon: '🚚', text: 'جاري توصيل الطلب', cls: 'badge-delivering' },
                    'delivered': { icon: '📦', text: 'تم التوصيل ✓', cls: 'badge-delivered' },
                    'rejected': { icon: '❌', text: 'تم رفض الطلب', cls: 'badge-rejected' }
                };
                const st = statusMap[order.status] || statusMap['pending'];
                const orderTotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);

                html += `
                <div class="current-order-block">
                    <div style="font-size:40px;">${st.icon}</div>
                    <div class="status-badge-lg ${st.cls}">${st.text}</div>
                    <p><strong>رقم الطلب:</strong> #${order.orderId.slice(-8)}</p>
                    <p><strong>الإجمالي:</strong> ${orderTotal} جنيه</p>
                    ${order.orderData?.recipientName ? `<p><strong>المستلم:</strong> ${order.orderData.recipientName}</p>` : ''}
                    <div class="order-items-preview">
                        <small>المنتجات:</small>
                        ${(order.items || []).map(it => `
                            <div class="order-item-mini">
                                <span>${it.name} × ${it.quantity}</span>
                                <span>${it.price * it.quantity} ج</span>
                            </div>
                        `).join('')}
                    </div>
                    ${order.orderData?.rejectionReason ? `<div class="rejection-reason">❌ سبب الرفض: ${order.orderData.rejectionReason}${order.orderData.rejectionDetails ? ' - ' + order.orderData.rejectionDetails : ''}</div>` : ''}
                    ${order.status === 'delivered' && orderTimers[order.orderId] ? '<p style="color:var(--coffee-light);font-size:12px;margin-top:8px;">⏱️ سيختفي بعد 10 دقائق</p>' : ''}
                </div>`;
            });

            html += '</div>';
        }

        html += `<div class="cart-section">
            <div class="cart-section-title"><i class="fa-solid fa-cart-shopping"></i> سلة التسوق (طلب جديد)</div>`;

        if (cartItems.length === 0) {
            html += `<div class="empty-state">
                <span class="empty-icon">🛒</span>
                <h3>سلة التسوق فارغة</h3>
                <p>أضف منتجات من المتجر لبدء طلب جديد</p>
            </div>`;
        } else {
            let total = 0;
            html += '<div class="cart-items-list">';

            cartItems.forEach((item, idx) => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                html += `
                <div class="cart-item">
                    <img class="cart-img" src="${item.image || ''}" alt="${item.name}" 
                         onerror="this.style.background='var(--coffee-foam)';this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23F5EDE4%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2240%22>☕</text></svg>';">
                    <div class="cart-details">
                        <strong>${item.name}</strong><br>
                        <small>${item.price} ج للوحدة</small>
                    </div>
                    <div class="qty-wrapper">
                        <button class="qty-btn" onclick="window.changeItemQty(${idx}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="window.changeItemQty(${idx}, 1)" ${item.quantity >= (item.maxQty || 99) ? 'disabled' : ''}>+</button>
                    </div>
                    <div class="cart-item-total">${itemTotal} ج</div>
                    <button class="delete-btn" onclick="window.removeItemFromCart(${idx})" title="حذف">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
            });

            html += `</div>
            <div class="cart-total-row">الإجمالي: ${total} <small>جنيه مصري</small></div>
            <div class="action-buttons">
                <button class="btn btn-outline" onclick="navigateTo('home')">
                    <i class="fa-solid fa-plus"></i> متابعة التسوق
                </button>
                <button class="btn btn-primary" onclick="window.openOrderModal()">
                    <i class="fa-solid fa-paper-plane"></i> تأكيد الطلب
                </button>
                <button class="btn btn-danger" onclick="window.clearCart()">
                    <i class="fa-solid fa-trash"></i> تفريغ السلة
                </button>
            </div>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    window.changeItemQty = function(idx, delta) {
        if (idx < 0 || idx >= cartItems.length) return;
        const item = cartItems[idx];
        const newQty = item.quantity + delta;
        if (newQty < 1) return;
        const product = allProducts.find(p => p.id === item.productId);
        const maxStock = product ? product.quantity : (item.maxQty || 99);
        if (newQty > maxStock && delta > 0) {
            showToast('⚠️ الكمية غير متوفرة', 'error');
            return;
        }
        item.quantity = newQty;
        saveCartToStorage();
        renderCartPage();
    };

    window.removeItemFromCart = function(idx) {
        if (idx < 0 || idx >= cartItems.length) return;
        const name = cartItems[idx].name;
        cartItems.splice(idx, 1);
        saveCartToStorage();
        renderCartPage();
        showToast(`🗑️ تم حذف "${name}"`);
    };

    window.clearCart = function() {
        if (cartItems.length === 0) return;
        if (confirm('هل أنت متأكد من تفريغ السلة؟')) {
            cartItems = [];
            saveCartToStorage();
            renderCartPage();
            showToast('🗑️ تم تفريغ السلة');
        }
    };

    window.addToCartHandler = function(prodId) {
        const product = allProducts.find(p => p.id === prodId);
        if (!product) {
            showToast('⚠️ المنتج غير موجود', 'error');
            return;
        }
        if (product.quantity < 1) {
            showToast('⚠️ المنتج غير متوفر حالياً', 'error');
            return;
        }

        const existingIdx = cartItems.findIndex(i => i.productId === prodId);
        if (existingIdx >= 0) {
            if (cartItems[existingIdx].quantity < product.quantity) {
                cartItems[existingIdx].quantity++;
                saveCartToStorage();
                showToast(`➕ تمت زيادة كمية "${product.name}"`, 'success');
            } else {
                showToast('⚠️ وصلت للحد الأقصى المتوفر', 'error');
            }
        } else {
            cartItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image || '',
                quantity: 1,
                maxQty: product.quantity
            });
            saveCartToStorage();
            showToast(`✅ تمت إضافة "${product.name}"`, 'success');
        }

        if (document.getElementById('cartPage').classList.contains('active')) {
            renderCartPage();
        }
    };

    window.openOrderModal = function() {
        if (cartItems.length === 0) {
            showToast('⚠️ السلة فارغة، أضف منتجات أولاً', 'error');
            return;
        }
        document.getElementById('orderModal').classList.add('active');
        document.getElementById('checkoutForm').reset();
    };

    window.closeOrderModal = function() {
        document.getElementById('orderModal').classList.remove('active');
    };

    window.submitNewOrder = async function() {
        const recipientName = document.getElementById('recipientName')?.value?.trim();
        const address = document.getElementById('addressInput')?.value?.trim();
        const phone = document.getElementById('phoneInput')?.value?.trim();

        if (!recipientName || !address || !phone) {
            showToast('⚠️ يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        if (!/^01[0-9]{9}$/.test(phone)) {
            showToast('⚠️ رقم هاتف غير صحيح', 'error');
            return;
        }

        if (cartItems.length === 0) {
            showToast('⚠️ السلة فارغة', 'error');
            return;
        }

        const totalPrice = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
        const orderData = {
            items: cartItems.map(it => ({
                productId: it.productId,
                name: it.name,
                price: it.price,
                quantity: it.quantity,
                image: it.image || ''
            })),
            total: totalPrice,
            recipientName,
            address,
            phone,
            status: 'pending',
            createdAt: Date.now()
        };

        try {
            const newRef = push(ref(database, 'orders'));
            await set(newRef, orderData);

            activeOrders.push({
                orderId: newRef.key,
                status: 'pending',
                items: orderData.items,
                orderData
            });
            saveOrderIdsToStorage();

            cartItems = [];
            saveCartToStorage();
            window.closeOrderModal();
            showToast('🎉 تم إرسال الطلب بنجاح!', 'success');
            listenToOrderUpdates(newRef.key);
            renderCartPage();
            navigateTo('cart');
        } catch (err) {
            console.error('خطأ في إرسال الطلب:', err);
            showToast('❌ فشل إرسال الطلب، حاول مرة أخرى', 'error');
        }
    };

    function loadProducts() {
        const prodRef = ref(database, 'products');
        onValue(prodRef, (snap) => {
            allProducts = [];
            if (snap.exists()) {
                snap.forEach(child => {
                    allProducts.push({ id: child.key, ...child.val() });
                });
            }
            console.log(`📦 تم تحميل ${allProducts.length} منتج`);
            
            cartItems.forEach(item => {
                const product = allProducts.find(p => p.id === item.productId);
                if (product) {
                    item.maxQty = product.quantity;
                }
            });
            saveCartToStorage();
            
            if (document.getElementById('homePage').classList.contains('active')) {
                renderHomeProducts();
            }
        });
    }

    // ✅ تم دمج renderHomeProducts مع filterAndRenderProducts في دالة واحدة
    function renderHomeProducts(filterText = '') {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        
        // تصفية المنتجات حسب النص
        let filtered = allProducts;
        if (filterText && filterText.length > 0) {
            const q = filterText.toLowerCase();
            filtered = allProducts.filter(p => {
                const name = (p.name || '').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                return name.includes(q) || desc.includes(q);
            });
        }
        
        // حالة: لا توجد منتجات أصلاً
        if (allProducts.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <span style="font-size:60px;">☕</span>
                <p style="color:var(--coffee-light);margin-top:16px;">لا توجد منتجات متاحة حالياً</p>
                <p style="color:var(--coffee-cream);font-size:14px;">يرجى التحقق لاحقاً</p>
            </div>`;
            return;
        }
        
        // حالة: لا نتائج للبحث
        if (filterText && filtered.length === 0) {
            grid.innerHTML = `<div class="search-no-results">
                <span class="search-no-icon">🔍</span>
                <h3>لا توجد نتائج</h3>
                <p>لم نجد منتجات تطابق "${filterText}"</p>
                <p style="font-size:13px;color:var(--coffee-cream);margin-top:6px;">جرب كلمة بحث أخرى</p>
            </div>`;
            return;
        }
        
        // عرض المنتجات
        grid.innerHTML = filtered.map(p => {
            const available = p.quantity > 0;
            const productImage = p.image || '';
            
            return `<div class="product-card">
                <div class="product-img-wrap">
                    <img src="${productImage}" 
                         alt="${p.name || 'منتج'}" 
                         loading="lazy"
                         onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect fill=%22%23F5EDE4%22 width=%22300%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2280%22>☕</text></svg>';">
                    <span class="stock-badge ${available ? 'stock-available' : 'stock-out'}">
                        ${available ? '✓ متوفر' : '✗ نفذ المخزون'}
                    </span>
                </div>
                <div class="product-info">
                    <div class="product-name">${p.name || 'منتج بدون اسم'}</div>
                    <div class="product-desc">${p.description || 'منتج قهوة مختصة'}</div>
                    <div class="price-row">
                        <span class="price">${Number(p.price || 0).toFixed(2)} <small>جنيه</small></span>
                        <button class="add-btn" ${!available ? 'disabled' : ''} onclick="window.addToCartHandler('${p.id}')">
                            <i class="fa-solid fa-cart-plus"></i> أضف للسلة
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        console.log(`✅ عرض ${filtered.length} من ${allProducts.length} منتج`);
    }

    function loadLogo() {
        onValue(ref(database, 'settings/logo'), (snap) => {
            const logoDisplay = document.getElementById('logoDisplay');
            if (snap.exists() && snap.val().base64 && logoDisplay) {
                logoDisplay.innerHTML = 
                    `<img src="${snap.val().base64}" alt="شعار رشفة" style="width:100%;height:100%;object-fit:cover;">`;
            }
        });
    }

    // ✅ دالة البحث المتكاملة
    function setupAdvancedSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        
        if (!searchInput || !searchClear) return;

        // البحث أثناء الكتابة
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            searchClear.classList.toggle('visible', query.length > 0);
            if (document.getElementById('homePage').classList.contains('active')) {
                renderHomeProducts(query);
            }
        });

        // زر مسح البحث
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            this.classList.remove('visible');
            if (document.getElementById('homePage').classList.contains('active')) {
                renderHomeProducts('');
            }
            searchInput.focus();
        });

        // البحث عند الضغط على Enter
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (document.getElementById('homePage').classList.contains('active')) {
                    renderHomeProducts(query);
                }
            }
        });

        console.log('✅ نظام البحث جاهز');
    }

    function init() {
        console.log('☕ بدء تشغيل متجر رشفة...');
        loadProducts();
        loadLogo();
        updateCartBadge();
        setupAdvancedSearch();

        savedOrderIds.forEach(oid => listenToOrderUpdates(oid));

        window.navigateTo = navigateTo;
        window.openOrderModal = window.openOrderModal;
        window.closeOrderModal = window.closeOrderModal;
        window.submitNewOrder = window.submitNewOrder;
        window.addToCartHandler = window.addToCartHandler;
        window.changeItemQty = window.changeItemQty;
        window.removeItemFromCart = window.removeItemFromCart;
        window.clearCart = window.clearCart;

        console.log('✅ متجر رشفة جاهز للاستخدام');
        console.log(`📦 ${allProducts.length} منتج محمل`);
        console.log(`🛒 ${cartItems.length} عنصر في السلة`);
        console.log(`📋 ${activeOrders.length} طلب نشط`);
    }

    init();
