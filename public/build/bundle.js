
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/dh.svelte generated by Svelte v3.29.4 */

    const file = "src/components/dh.svelte";

    function create_fragment(ctx) {
    	let section;
    	let article0;
    	let h10;
    	let t1;
    	let p0;
    	let t2;
    	let input0;
    	let t3;
    	let p1;
    	let t5;
    	let t6_value = /*g*/ ctx[2] ** /*a*/ ctx[0] % /*p*/ ctx[3] + "";
    	let t6;
    	let t7;
    	let p2;
    	let t9;
    	let t10_value = (/*g*/ ctx[2] ** /*b*/ ctx[1] % /*p*/ ctx[3]) ** /*a*/ ctx[0] % /*p*/ ctx[3] + "";
    	let t10;
    	let t11;
    	let article1;
    	let h11;
    	let t13;
    	let p3;
    	let t14;
    	let input1;
    	let t15;
    	let p4;
    	let t16;
    	let input2;
    	let t17;
    	let h20;
    	let t19;
    	let p5;
    	let t20;
    	let t21_value = /*g*/ ctx[2] ** /*a*/ ctx[0] % /*p*/ ctx[3] + "";
    	let t21;
    	let t22;
    	let t23_value = /*g*/ ctx[2] ** /*b*/ ctx[1] % /*p*/ ctx[3] + "";
    	let t23;
    	let t24;
    	let h21;
    	let t26;
    	let article2;
    	let h12;
    	let t28;
    	let p6;
    	let t29;
    	let input3;
    	let t30;
    	let p7;
    	let t32;
    	let t33_value = /*g*/ ctx[2] ** /*b*/ ctx[1] % /*p*/ ctx[3] + "";
    	let t33;
    	let t34;
    	let p8;
    	let t36;
    	let t37_value = (/*g*/ ctx[2] ** /*a*/ ctx[0] % /*p*/ ctx[3]) ** /*b*/ ctx[1] % /*p*/ ctx[3] + "";
    	let t37;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			article0 = element("article");
    			h10 = element("h1");
    			h10.textContent = "Alice/User";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("a: ");
    			input0 = element("input");
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = " ";
    			t5 = text("\n        A = g^a mod p =\n        ");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = " ";
    			t9 = text("\n        K = B^a mod p =\n        ");
    			t10 = text(t10_value);
    			t11 = space();
    			article1 = element("article");
    			h11 = element("h1");
    			h11.textContent = "Public Information";
    			t13 = space();
    			p3 = element("p");
    			t14 = text("p: ");
    			input1 = element("input");
    			t15 = space();
    			p4 = element("p");
    			t16 = text("g: ");
    			input2 = element("input");
    			t17 = space();
    			h20 = element("h2");
    			h20.textContent = "Personal Keys";
    			t19 = space();
    			p5 = element("p");
    			t20 = text("A = ");
    			t21 = text(t21_value);
    			t22 = text(", B = ");
    			t23 = text(t23_value);
    			t24 = space();
    			h21 = element("h2");
    			h21.textContent = "Keys Exchanged";
    			t26 = space();
    			article2 = element("article");
    			h12 = element("h1");
    			h12.textContent = "Bob/Server";
    			t28 = space();
    			p6 = element("p");
    			t29 = text("b: ");
    			input3 = element("input");
    			t30 = space();
    			p7 = element("p");
    			p7.textContent = " ";
    			t32 = text("\n        B = g^b mod p\n        ");
    			t33 = text(t33_value);
    			t34 = space();
    			p8 = element("p");
    			p8.textContent = " ";
    			t36 = text("\n        K = A^b mod p =\n        ");
    			t37 = text(t37_value);
    			add_location(h10, file, 22, 8, 451);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "svelte-jgp87s");
    			add_location(input0, file, 23, 14, 485);
    			attr_dev(p0, "class", "svelte-jgp87s");
    			add_location(p0, file, 23, 8, 479);
    			attr_dev(p1, "class", "svelte-jgp87s");
    			add_location(p1, file, 24, 8, 536);
    			attr_dev(p2, "class", "svelte-jgp87s");
    			add_location(p2, file, 27, 8, 603);
    			set_style(article0, "background", "#fee");
    			set_style(article0, "border-radius", "10px");
    			attr_dev(article0, "class", "svelte-jgp87s");
    			add_location(article0, file, 21, 4, 390);
    			add_location(h11, file, 32, 8, 710);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-jgp87s");
    			add_location(input1, file, 33, 14, 752);
    			attr_dev(p3, "class", "svelte-jgp87s");
    			add_location(p3, file, 33, 8, 746);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-jgp87s");
    			add_location(input2, file, 34, 14, 809);
    			attr_dev(p4, "class", "svelte-jgp87s");
    			add_location(p4, file, 34, 8, 803);
    			attr_dev(h20, "class", "svelte-jgp87s");
    			add_location(h20, file, 35, 8, 860);
    			attr_dev(p5, "class", "svelte-jgp87s");
    			add_location(p5, file, 36, 8, 891);
    			attr_dev(h21, "class", "svelte-jgp87s");
    			add_location(h21, file, 37, 8, 941);
    			attr_dev(article1, "class", "svelte-jgp87s");
    			add_location(article1, file, 31, 4, 692);
    			add_location(h12, file, 40, 8, 1045);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "svelte-jgp87s");
    			add_location(input3, file, 41, 14, 1079);
    			attr_dev(p6, "class", "svelte-jgp87s");
    			add_location(p6, file, 41, 8, 1073);
    			attr_dev(p7, "class", "svelte-jgp87s");
    			add_location(p7, file, 42, 8, 1130);
    			attr_dev(p8, "class", "svelte-jgp87s");
    			add_location(p8, file, 45, 8, 1195);
    			set_style(article2, "background", "#efe");
    			set_style(article2, "border-radius", "10px");
    			attr_dev(article2, "class", "svelte-jgp87s");
    			add_location(article2, file, 39, 4, 984);
    			attr_dev(section, "class", "svelte-jgp87s");
    			add_location(section, file, 20, 0, 376);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, article0);
    			append_dev(article0, h10);
    			append_dev(article0, t1);
    			append_dev(article0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, input0);
    			set_input_value(input0, /*a*/ ctx[0]);
    			append_dev(article0, t3);
    			append_dev(article0, p1);
    			append_dev(article0, t5);
    			append_dev(article0, t6);
    			append_dev(article0, t7);
    			append_dev(article0, p2);
    			append_dev(article0, t9);
    			append_dev(article0, t10);
    			append_dev(section, t11);
    			append_dev(section, article1);
    			append_dev(article1, h11);
    			append_dev(article1, t13);
    			append_dev(article1, p3);
    			append_dev(p3, t14);
    			append_dev(p3, input1);
    			set_input_value(input1, /*p*/ ctx[3]);
    			append_dev(article1, t15);
    			append_dev(article1, p4);
    			append_dev(p4, t16);
    			append_dev(p4, input2);
    			set_input_value(input2, /*g*/ ctx[2]);
    			append_dev(article1, t17);
    			append_dev(article1, h20);
    			append_dev(article1, t19);
    			append_dev(article1, p5);
    			append_dev(p5, t20);
    			append_dev(p5, t21);
    			append_dev(p5, t22);
    			append_dev(p5, t23);
    			append_dev(article1, t24);
    			append_dev(article1, h21);
    			append_dev(section, t26);
    			append_dev(section, article2);
    			append_dev(article2, h12);
    			append_dev(article2, t28);
    			append_dev(article2, p6);
    			append_dev(p6, t29);
    			append_dev(p6, input3);
    			set_input_value(input3, /*b*/ ctx[1]);
    			append_dev(article2, t30);
    			append_dev(article2, p7);
    			append_dev(article2, t32);
    			append_dev(article2, t33);
    			append_dev(article2, t34);
    			append_dev(article2, p8);
    			append_dev(article2, t36);
    			append_dev(article2, t37);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[6]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*a*/ 1 && to_number(input0.value) !== /*a*/ ctx[0]) {
    				set_input_value(input0, /*a*/ ctx[0]);
    			}

    			if (dirty & /*g, a, p*/ 13 && t6_value !== (t6_value = /*g*/ ctx[2] ** /*a*/ ctx[0] % /*p*/ ctx[3] + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*g, b, p, a*/ 15 && t10_value !== (t10_value = (/*g*/ ctx[2] ** /*b*/ ctx[1] % /*p*/ ctx[3]) ** /*a*/ ctx[0] % /*p*/ ctx[3] + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*p*/ 8 && to_number(input1.value) !== /*p*/ ctx[3]) {
    				set_input_value(input1, /*p*/ ctx[3]);
    			}

    			if (dirty & /*g*/ 4 && to_number(input2.value) !== /*g*/ ctx[2]) {
    				set_input_value(input2, /*g*/ ctx[2]);
    			}

    			if (dirty & /*g, a, p*/ 13 && t21_value !== (t21_value = /*g*/ ctx[2] ** /*a*/ ctx[0] % /*p*/ ctx[3] + "")) set_data_dev(t21, t21_value);
    			if (dirty & /*g, b, p*/ 14 && t23_value !== (t23_value = /*g*/ ctx[2] ** /*b*/ ctx[1] % /*p*/ ctx[3] + "")) set_data_dev(t23, t23_value);

    			if (dirty & /*b*/ 2 && to_number(input3.value) !== /*b*/ ctx[1]) {
    				set_input_value(input3, /*b*/ ctx[1]);
    			}

    			if (dirty & /*g, b, p*/ 14 && t33_value !== (t33_value = /*g*/ ctx[2] ** /*b*/ ctx[1] % /*p*/ ctx[3] + "")) set_data_dev(t33, t33_value);
    			if (dirty & /*g, a, p, b*/ 15 && t37_value !== (t37_value = (/*g*/ ctx[2] ** /*a*/ ctx[0] % /*p*/ ctx[3]) ** /*b*/ ctx[1] % /*p*/ ctx[3] + "")) set_data_dev(t37, t37_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dh", slots, []);
    	let a, b, g, p;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dh> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		a = to_number(this.value);
    		$$invalidate(0, a);
    	}

    	function input1_input_handler() {
    		p = to_number(this.value);
    		$$invalidate(3, p);
    	}

    	function input2_input_handler() {
    		g = to_number(this.value);
    		$$invalidate(2, g);
    	}

    	function input3_input_handler() {
    		b = to_number(this.value);
    		$$invalidate(1, b);
    	}

    	$$self.$capture_state = () => ({ a, b, g, p });

    	$$self.$inject_state = $$props => {
    		if ("a" in $$props) $$invalidate(0, a = $$props.a);
    		if ("b" in $$props) $$invalidate(1, b = $$props.b);
    		if ("g" in $$props) $$invalidate(2, g = $$props.g);
    		if ("p" in $$props) $$invalidate(3, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		a,
    		b,
    		g,
    		p,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class Dh extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dh",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/ManIM.svelte generated by Svelte v3.29.4 */

    const file$1 = "src/components/ManIM.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let input0;
    	let t1;
    	let p1;
    	let t2;
    	let input1;
    	let t3;
    	let section;
    	let article0;
    	let h10;
    	let t5;
    	let p2;
    	let t6;
    	let input2;
    	let t7;
    	let p3;
    	let t9;
    	let t10_value = /*g*/ ctx[4] ** /*a*/ ctx[0] % /*p*/ ctx[5] + "";
    	let t10;
    	let t11;
    	let p4;
    	let t13;
    	let t14_value = (/*g*/ ctx[4] ** /*ai*/ ctx[2] % /*p*/ ctx[5]) ** /*a*/ ctx[0] % /*p*/ ctx[5] + "";
    	let t14;
    	let t15;
    	let article1;
    	let h11;
    	let t17;
    	let p5;
    	let t18;
    	let input3;
    	let t19;
    	let p6;
    	let t21;
    	let t22_value = /*g*/ ctx[4] ** /*ai*/ ctx[2] % /*p*/ ctx[5] + "";
    	let t22;
    	let t23;
    	let p7;
    	let t25;
    	let t26_value = (/*g*/ ctx[4] ** /*a*/ ctx[0] % /*p*/ ctx[5]) ** /*ai*/ ctx[2] % /*p*/ ctx[5] + "";
    	let t26;
    	let t27;
    	let article2;
    	let h12;
    	let t29;
    	let p8;
    	let t30;
    	let input4;
    	let t31;
    	let p9;
    	let t33;
    	let t34_value = /*g*/ ctx[4] ** /*bi*/ ctx[3] % /*p*/ ctx[5] + "";
    	let t34;
    	let t35;
    	let p10;
    	let t37;
    	let t38_value = (/*g*/ ctx[4] ** /*b*/ ctx[1] % /*p*/ ctx[5]) ** /*bi*/ ctx[3] % /*p*/ ctx[5] + "";
    	let t38;
    	let t39;
    	let article3;
    	let h13;
    	let t41;
    	let p11;
    	let t42;
    	let input5;
    	let t43;
    	let p12;
    	let t45;
    	let t46_value = /*g*/ ctx[4] ** /*b*/ ctx[1] % /*p*/ ctx[5] + "";
    	let t46;
    	let t47;
    	let p13;
    	let t49;
    	let t50_value = (/*g*/ ctx[4] ** /*bi*/ ctx[3] % /*p*/ ctx[5]) ** /*b*/ ctx[1] % /*p*/ ctx[5] + "";
    	let t50;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("p: ");
    			input0 = element("input");
    			t1 = space();
    			p1 = element("p");
    			t2 = text("g: ");
    			input1 = element("input");
    			t3 = space();
    			section = element("section");
    			article0 = element("article");
    			h10 = element("h1");
    			h10.textContent = "Alice/User";
    			t5 = space();
    			p2 = element("p");
    			t6 = text("a: ");
    			input2 = element("input");
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = " ";
    			t9 = text("\n        A = g^a mod p =\n        ");
    			t10 = text(t10_value);
    			t11 = space();
    			p4 = element("p");
    			p4.textContent = " ";
    			t13 = text("\n        K1 = B'^a mod p =\n        ");
    			t14 = text(t14_value);
    			t15 = space();
    			article1 = element("article");
    			h11 = element("h1");
    			h11.textContent = "Zuck to Alice";
    			t17 = space();
    			p5 = element("p");
    			t18 = text("a': ");
    			input3 = element("input");
    			t19 = space();
    			p6 = element("p");
    			p6.textContent = " ";
    			t21 = text("\n        B' = g^a' mod p =\n        ");
    			t22 = text(t22_value);
    			t23 = space();
    			p7 = element("p");
    			p7.textContent = " ";
    			t25 = text("\n        K1 = A^a' mod p =\n        ");
    			t26 = text(t26_value);
    			t27 = space();
    			article2 = element("article");
    			h12 = element("h1");
    			h12.textContent = "Zuck to Bob";
    			t29 = space();
    			p8 = element("p");
    			t30 = text("b': ");
    			input4 = element("input");
    			t31 = space();
    			p9 = element("p");
    			p9.textContent = " ";
    			t33 = text("\n        A' = g^b' mod p =\n        ");
    			t34 = text(t34_value);
    			t35 = space();
    			p10 = element("p");
    			p10.textContent = " ";
    			t37 = text("\n        K2 = B^b' mod p =\n        ");
    			t38 = text(t38_value);
    			t39 = space();
    			article3 = element("article");
    			h13 = element("h1");
    			h13.textContent = "Bob/Server";
    			t41 = space();
    			p11 = element("p");
    			t42 = text("b: ");
    			input5 = element("input");
    			t43 = space();
    			p12 = element("p");
    			p12.textContent = " ";
    			t45 = text("\n        B = g^b mod p =\n        ");
    			t46 = text(t46_value);
    			t47 = space();
    			p13 = element("p");
    			p13.textContent = " ";
    			t49 = text("\n        K2 = A'^b mod p =\n        ");
    			t50 = text(t50_value);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "svelte-1u3rygi");
    			add_location(input0, file$1, 21, 10, 430);
    			add_location(p0, file$1, 21, 4, 424);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-1u3rygi");
    			add_location(input1, file$1, 22, 10, 483);
    			add_location(p1, file$1, 22, 4, 477);
    			set_style(div, "display", "flex");
    			set_style(div, "justify-content", "space-around");
    			set_style(div, "font-size", "1.33em");
    			set_style(div, "padding-top", "10px");
    			add_location(div, file$1, 19, 0, 325);
    			add_location(h10, file$1, 26, 8, 608);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-1u3rygi");
    			add_location(input2, file$1, 27, 14, 642);
    			attr_dev(p2, "class", "svelte-1u3rygi");
    			add_location(p2, file$1, 27, 8, 636);
    			attr_dev(p3, "class", "svelte-1u3rygi");
    			add_location(p3, file$1, 28, 8, 693);
    			attr_dev(p4, "class", "svelte-1u3rygi");
    			add_location(p4, file$1, 31, 8, 760);
    			set_style(article0, "background", "#fee");
    			set_style(article0, "border-radius", "10px");
    			attr_dev(article0, "class", "svelte-1u3rygi");
    			add_location(article0, file$1, 25, 4, 547);
    			add_location(h11, file$1, 36, 8, 870);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "class", "svelte-1u3rygi");
    			add_location(input3, file$1, 37, 15, 908);
    			attr_dev(p5, "class", "svelte-1u3rygi");
    			add_location(p5, file$1, 37, 8, 901);
    			attr_dev(p6, "class", "svelte-1u3rygi");
    			add_location(p6, file$1, 38, 8, 960);
    			attr_dev(p7, "class", "svelte-1u3rygi");
    			add_location(p7, file$1, 41, 8, 1030);
    			attr_dev(article1, "class", "svelte-1u3rygi");
    			add_location(article1, file$1, 35, 4, 852);
    			add_location(h12, file$1, 46, 8, 1140);
    			attr_dev(input4, "type", "number");
    			attr_dev(input4, "class", "svelte-1u3rygi");
    			add_location(input4, file$1, 47, 15, 1176);
    			attr_dev(p8, "class", "svelte-1u3rygi");
    			add_location(p8, file$1, 47, 8, 1169);
    			attr_dev(p9, "class", "svelte-1u3rygi");
    			add_location(p9, file$1, 48, 8, 1228);
    			attr_dev(p10, "class", "svelte-1u3rygi");
    			add_location(p10, file$1, 51, 8, 1298);
    			attr_dev(article2, "class", "svelte-1u3rygi");
    			add_location(article2, file$1, 45, 4, 1122);
    			add_location(h13, file$1, 56, 8, 1451);
    			attr_dev(input5, "type", "number");
    			attr_dev(input5, "class", "svelte-1u3rygi");
    			add_location(input5, file$1, 57, 14, 1485);
    			attr_dev(p11, "class", "svelte-1u3rygi");
    			add_location(p11, file$1, 57, 8, 1479);
    			attr_dev(p12, "class", "svelte-1u3rygi");
    			add_location(p12, file$1, 58, 8, 1536);
    			attr_dev(p13, "class", "svelte-1u3rygi");
    			add_location(p13, file$1, 61, 8, 1603);
    			set_style(article3, "background", "#efe");
    			set_style(article3, "border-radius", "10px");
    			attr_dev(article3, "class", "svelte-1u3rygi");
    			add_location(article3, file$1, 55, 4, 1390);
    			attr_dev(section, "class", "svelte-1u3rygi");
    			add_location(section, file$1, 24, 0, 533);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, input0);
    			set_input_value(input0, /*p*/ ctx[5]);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    			append_dev(p1, input1);
    			set_input_value(input1, /*g*/ ctx[4]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, article0);
    			append_dev(article0, h10);
    			append_dev(article0, t5);
    			append_dev(article0, p2);
    			append_dev(p2, t6);
    			append_dev(p2, input2);
    			set_input_value(input2, /*a*/ ctx[0]);
    			append_dev(article0, t7);
    			append_dev(article0, p3);
    			append_dev(article0, t9);
    			append_dev(article0, t10);
    			append_dev(article0, t11);
    			append_dev(article0, p4);
    			append_dev(article0, t13);
    			append_dev(article0, t14);
    			append_dev(section, t15);
    			append_dev(section, article1);
    			append_dev(article1, h11);
    			append_dev(article1, t17);
    			append_dev(article1, p5);
    			append_dev(p5, t18);
    			append_dev(p5, input3);
    			set_input_value(input3, /*ai*/ ctx[2]);
    			append_dev(article1, t19);
    			append_dev(article1, p6);
    			append_dev(article1, t21);
    			append_dev(article1, t22);
    			append_dev(article1, t23);
    			append_dev(article1, p7);
    			append_dev(article1, t25);
    			append_dev(article1, t26);
    			append_dev(section, t27);
    			append_dev(section, article2);
    			append_dev(article2, h12);
    			append_dev(article2, t29);
    			append_dev(article2, p8);
    			append_dev(p8, t30);
    			append_dev(p8, input4);
    			set_input_value(input4, /*bi*/ ctx[3]);
    			append_dev(article2, t31);
    			append_dev(article2, p9);
    			append_dev(article2, t33);
    			append_dev(article2, t34);
    			append_dev(article2, t35);
    			append_dev(article2, p10);
    			append_dev(article2, t37);
    			append_dev(article2, t38);
    			append_dev(section, t39);
    			append_dev(section, article3);
    			append_dev(article3, h13);
    			append_dev(article3, t41);
    			append_dev(article3, p11);
    			append_dev(p11, t42);
    			append_dev(p11, input5);
    			set_input_value(input5, /*b*/ ctx[1]);
    			append_dev(article3, t43);
    			append_dev(article3, p12);
    			append_dev(article3, t45);
    			append_dev(article3, t46);
    			append_dev(article3, t47);
    			append_dev(article3, p13);
    			append_dev(article3, t49);
    			append_dev(article3, t50);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[6]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[7]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[8]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[9]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[10]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[11])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*p*/ 32 && to_number(input0.value) !== /*p*/ ctx[5]) {
    				set_input_value(input0, /*p*/ ctx[5]);
    			}

    			if (dirty & /*g*/ 16 && to_number(input1.value) !== /*g*/ ctx[4]) {
    				set_input_value(input1, /*g*/ ctx[4]);
    			}

    			if (dirty & /*a*/ 1 && to_number(input2.value) !== /*a*/ ctx[0]) {
    				set_input_value(input2, /*a*/ ctx[0]);
    			}

    			if (dirty & /*g, a, p*/ 49 && t10_value !== (t10_value = /*g*/ ctx[4] ** /*a*/ ctx[0] % /*p*/ ctx[5] + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*g, ai, p, a*/ 53 && t14_value !== (t14_value = (/*g*/ ctx[4] ** /*ai*/ ctx[2] % /*p*/ ctx[5]) ** /*a*/ ctx[0] % /*p*/ ctx[5] + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*ai*/ 4 && to_number(input3.value) !== /*ai*/ ctx[2]) {
    				set_input_value(input3, /*ai*/ ctx[2]);
    			}

    			if (dirty & /*g, ai, p*/ 52 && t22_value !== (t22_value = /*g*/ ctx[4] ** /*ai*/ ctx[2] % /*p*/ ctx[5] + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*g, a, p, ai*/ 53 && t26_value !== (t26_value = (/*g*/ ctx[4] ** /*a*/ ctx[0] % /*p*/ ctx[5]) ** /*ai*/ ctx[2] % /*p*/ ctx[5] + "")) set_data_dev(t26, t26_value);

    			if (dirty & /*bi*/ 8 && to_number(input4.value) !== /*bi*/ ctx[3]) {
    				set_input_value(input4, /*bi*/ ctx[3]);
    			}

    			if (dirty & /*g, bi, p*/ 56 && t34_value !== (t34_value = /*g*/ ctx[4] ** /*bi*/ ctx[3] % /*p*/ ctx[5] + "")) set_data_dev(t34, t34_value);
    			if (dirty & /*g, b, p, bi*/ 58 && t38_value !== (t38_value = (/*g*/ ctx[4] ** /*b*/ ctx[1] % /*p*/ ctx[5]) ** /*bi*/ ctx[3] % /*p*/ ctx[5] + "")) set_data_dev(t38, t38_value);

    			if (dirty & /*b*/ 2 && to_number(input5.value) !== /*b*/ ctx[1]) {
    				set_input_value(input5, /*b*/ ctx[1]);
    			}

    			if (dirty & /*g, b, p*/ 50 && t46_value !== (t46_value = /*g*/ ctx[4] ** /*b*/ ctx[1] % /*p*/ ctx[5] + "")) set_data_dev(t46, t46_value);
    			if (dirty & /*g, bi, p, b*/ 58 && t50_value !== (t50_value = (/*g*/ ctx[4] ** /*bi*/ ctx[3] % /*p*/ ctx[5]) ** /*b*/ ctx[1] % /*p*/ ctx[5] + "")) set_data_dev(t50, t50_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ManIM", slots, []);
    	let a, b, ai, bi, g, p;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ManIM> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		p = to_number(this.value);
    		$$invalidate(5, p);
    	}

    	function input1_input_handler() {
    		g = to_number(this.value);
    		$$invalidate(4, g);
    	}

    	function input2_input_handler() {
    		a = to_number(this.value);
    		$$invalidate(0, a);
    	}

    	function input3_input_handler() {
    		ai = to_number(this.value);
    		$$invalidate(2, ai);
    	}

    	function input4_input_handler() {
    		bi = to_number(this.value);
    		$$invalidate(3, bi);
    	}

    	function input5_input_handler() {
    		b = to_number(this.value);
    		$$invalidate(1, b);
    	}

    	$$self.$capture_state = () => ({ a, b, ai, bi, g, p });

    	$$self.$inject_state = $$props => {
    		if ("a" in $$props) $$invalidate(0, a = $$props.a);
    		if ("b" in $$props) $$invalidate(1, b = $$props.b);
    		if ("ai" in $$props) $$invalidate(2, ai = $$props.ai);
    		if ("bi" in $$props) $$invalidate(3, bi = $$props.bi);
    		if ("g" in $$props) $$invalidate(4, g = $$props.g);
    		if ("p" in $$props) $$invalidate(5, p = $$props.p);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		a,
    		b,
    		ai,
    		bi,
    		g,
    		p,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	];
    }

    class ManIM extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ManIM",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/components/bbef.svelte generated by Svelte v3.29.4 */

    const file$2 = "src/components/bbef.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context_8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    // (66:12) {#each aStr as aChar}
    function create_each_block_8(ctx) {
    	let div;
    	let t_value = /*aChar*/ ctx[33] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$2, 66, 16, 1804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8.name,
    		type: "each",
    		source: "(66:12) {#each aStr as aChar}",
    		ctx
    	});

    	return block;
    }

    // (72:12) {#each aBasis as aBase}
    function create_each_block_7(ctx) {
    	let svg;
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");

    			attr_dev(path, "d", path_d_value = /*aBase*/ ctx[30]
    			? "M2 30 L30 2 M30 30 L2 2"
    			: "M16 2 L16 30 M2 16 L30 16");

    			add_location(path, file$2, 73, 20, 2034);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$2, 72, 16, 1971);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7.name,
    		type: "each",
    		source: "(72:12) {#each aBasis as aBase}",
    		ctx
    	});

    	return block;
    }

    // (81:12) {#each photons as photon}
    function create_each_block_6(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M2 16 L30 16");
    			add_location(path, file$2, 85, 20, 2456);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			set_style(svg, "transform", "rotate(" + (/*photon*/ ctx[27] + "deg") + ")");
    			add_location(svg, file$2, 81, 16, 2290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(81:12) {#each photons as photon}",
    		ctx
    	});

    	return block;
    }

    // (94:12) {#each bBasis as bBase}
    function create_each_block_5(ctx) {
    	let svg;
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");

    			attr_dev(path, "d", path_d_value = /*bBase*/ ctx[24]
    			? "M2 30 L30 2 M30 30 L2 2"
    			: "M16 2 L16 30 M2 16 L30 16");

    			add_location(path, file$2, 95, 20, 2787);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$2, 94, 16, 2724);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(94:12) {#each bBasis as bBase}",
    		ctx
    	});

    	return block;
    }

    // (103:12) {#each bStr as bChar}
    function create_each_block_4(ctx) {
    	let div;
    	let t_value = /*bChar*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$2, 103, 16, 3042);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(103:12) {#each bStr as bChar}",
    		ctx
    	});

    	return block;
    }

    // (109:12) {#each baseCheck as check}
    function create_each_block_3(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] ? "Y" : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$2, 109, 16, 3213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(109:12) {#each baseCheck as check}",
    		ctx
    	});

    	return block;
    }

    // (120:12) {#each baseCheck as check, i}
    function create_each_block_2(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] ? /*aStr*/ ctx[0][/*i*/ ctx[18]] : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$2, 120, 16, 3640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(120:12) {#each baseCheck as check, i}",
    		ctx
    	});

    	return block;
    }

    // (126:12) {#each eveCheck as check}
    function create_each_block_1(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] == -1 ? "" : /*check*/ ctx[14]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$2, 126, 16, 3820);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(126:12) {#each eveCheck as check}",
    		ctx
    	});

    	return block;
    }

    // (135:12) {#each final as char}
    function create_each_block(ctx) {
    	let div;
    	let t_value = (/*char*/ ctx[11] == -1 ? "" : /*char*/ ctx[11]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$2, 135, 16, 4144);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(135:12) {#each final as char}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let section;
    	let div0;
    	let t0;
    	let article0;
    	let t1;
    	let article1;
    	let t2;
    	let article2;
    	let t3;
    	let div1;
    	let t4;
    	let article3;
    	let t5;
    	let article4;
    	let t6;
    	let article5;
    	let t7;
    	let div2;
    	let t8;
    	let t9_value = /*baseCheck*/ ctx[5].filter(func).length + "";
    	let t9;
    	let t10;
    	let t11_value = /*aStr*/ ctx[0].length + "";
    	let t11;
    	let t12;
    	let t13_value = (/*baseCheck*/ ctx[5].filter(func_1).length / /*aStr*/ ctx[0].length * 100).toFixed(2) + "";
    	let t13;
    	let t14;
    	let article6;
    	let t15;
    	let article7;
    	let t16;
    	let t17_value = /*final*/ ctx[7].filter(func_2).length + "";
    	let t17;
    	let t18;
    	let t19_value = /*aStr*/ ctx[0].length + "";
    	let t19;
    	let t20;
    	let t21_value = (/*final*/ ctx[7].filter(func_3).length / /*aStr*/ ctx[0].length * 100).toFixed(2) + "";
    	let t21;
    	let t22;
    	let article8;
    	let each_value_8 = /*aStr*/ ctx[0];
    	validate_each_argument(each_value_8);
    	let each_blocks_8 = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks_8[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
    	}

    	let each_value_7 = /*aBasis*/ ctx[1];
    	validate_each_argument(each_value_7);
    	let each_blocks_7 = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks_7[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
    	}

    	let each_value_6 = /*photons*/ ctx[3];
    	validate_each_argument(each_value_6);
    	let each_blocks_6 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_6[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_value_5 = /*bBasis*/ ctx[2];
    	validate_each_argument(each_value_5);
    	let each_blocks_5 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_5[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let each_value_4 = /*bStr*/ ctx[4];
    	validate_each_argument(each_value_4);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_4[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*baseCheck*/ ctx[5];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*baseCheck*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*eveCheck*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*final*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			t0 = text("Alice's BitString\n        ");
    			article0 = element("article");

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].c();
    			}

    			t1 = text("\n        Alice's Bases\n        ");
    			article1 = element("article");

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].c();
    			}

    			t2 = text("\n        Photons Sent\n        ");
    			article2 = element("article");

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			t4 = text("Bob's Bases\n        ");
    			article3 = element("article");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t5 = text("\n        Bob's BitString\n        ");
    			article4 = element("article");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t6 = text("\n        Basis Matching\n        ");
    			article5 = element("article");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t7 = space();
    			div2 = element("div");
    			t8 = text("The Key: Lenth =\n        ");
    			t9 = text(t9_value);
    			t10 = text("/");
    			t11 = text(t11_value);
    			t12 = text("~\n        ");
    			t13 = text(t13_value);
    			t14 = text("%\n\n        ");
    			article6 = element("article");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t15 = text("\n        Eve Check\n        ");
    			article7 = element("article");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t16 = text("\n        Final Key\n        ");
    			t17 = text(t17_value);
    			t18 = text("/");
    			t19 = text(t19_value);
    			t20 = text("~\n        ");
    			t21 = text(t21_value);
    			t22 = text("%\n\n        ");
    			article8 = element("article");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(article0, "class", "svelte-oolxbf");
    			add_location(article0, file$2, 64, 8, 1744);
    			attr_dev(article1, "class", "svelte-oolxbf");
    			add_location(article1, file$2, 70, 8, 1909);
    			attr_dev(article2, "class", "svelte-oolxbf");
    			add_location(article2, file$2, 79, 8, 2226);
    			set_style(div0, "background", "#faf");
    			set_style(div0, "border-radius", "10px");
    			set_style(div0, "padding", "5px");
    			set_style(div0, "margin", "5px 0");
    			add_location(div0, file$2, 62, 4, 1635);
    			attr_dev(article3, "class", "svelte-oolxbf");
    			add_location(article3, file$2, 92, 8, 2662);
    			attr_dev(article4, "class", "svelte-oolxbf");
    			add_location(article4, file$2, 101, 8, 2982);
    			attr_dev(article5, "class", "svelte-oolxbf");
    			add_location(article5, file$2, 107, 8, 3148);
    			set_style(div1, "background", "#afa");
    			set_style(div1, "border-radius", "10px");
    			set_style(div1, "padding", "5px");
    			set_style(div1, "margin", "5px 0");
    			add_location(div1, file$2, 90, 4, 2559);
    			attr_dev(article6, "class", "svelte-oolxbf");
    			add_location(article6, file$2, 118, 8, 3572);
    			attr_dev(article7, "class", "svelte-oolxbf");
    			add_location(article7, file$2, 124, 8, 3756);
    			attr_dev(article8, "class", "svelte-oolxbf");
    			add_location(article8, file$2, 133, 8, 4084);
    			set_style(div2, "background", "#aaf");
    			set_style(div2, "border-radius", "10px");
    			set_style(div2, "padding", "5px");
    			set_style(div2, "margin", "5px 0");
    			add_location(div2, file$2, 113, 4, 3314);
    			attr_dev(section, "class", "svelte-oolxbf");
    			add_location(section, file$2, 61, 0, 1621);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, t0);
    			append_dev(div0, article0);

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].m(article0, null);
    			}

    			append_dev(div0, t1);
    			append_dev(div0, article1);

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].m(article1, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, article2);

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].m(article2, null);
    			}

    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, t4);
    			append_dev(div1, article3);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(article3, null);
    			}

    			append_dev(div1, t5);
    			append_dev(div1, article4);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(article4, null);
    			}

    			append_dev(div1, t6);
    			append_dev(div1, article5);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(article5, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, div2);
    			append_dev(div2, t8);
    			append_dev(div2, t9);
    			append_dev(div2, t10);
    			append_dev(div2, t11);
    			append_dev(div2, t12);
    			append_dev(div2, t13);
    			append_dev(div2, t14);
    			append_dev(div2, article6);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(article6, null);
    			}

    			append_dev(div2, t15);
    			append_dev(div2, article7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(article7, null);
    			}

    			append_dev(div2, t16);
    			append_dev(div2, t17);
    			append_dev(div2, t18);
    			append_dev(div2, t19);
    			append_dev(div2, t20);
    			append_dev(div2, t21);
    			append_dev(div2, t22);
    			append_dev(div2, article8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(article8, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aStr*/ 1) {
    				each_value_8 = /*aStr*/ ctx[0];
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8(ctx, each_value_8, i);

    					if (each_blocks_8[i]) {
    						each_blocks_8[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_8[i] = create_each_block_8(child_ctx);
    						each_blocks_8[i].c();
    						each_blocks_8[i].m(article0, null);
    					}
    				}

    				for (; i < each_blocks_8.length; i += 1) {
    					each_blocks_8[i].d(1);
    				}

    				each_blocks_8.length = each_value_8.length;
    			}

    			if (dirty[0] & /*aBasis*/ 2) {
    				each_value_7 = /*aBasis*/ ctx[1];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7(ctx, each_value_7, i);

    					if (each_blocks_7[i]) {
    						each_blocks_7[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_7[i] = create_each_block_7(child_ctx);
    						each_blocks_7[i].c();
    						each_blocks_7[i].m(article1, null);
    					}
    				}

    				for (; i < each_blocks_7.length; i += 1) {
    					each_blocks_7[i].d(1);
    				}

    				each_blocks_7.length = each_value_7.length;
    			}

    			if (dirty[0] & /*photons*/ 8) {
    				each_value_6 = /*photons*/ ctx[3];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks_6[i]) {
    						each_blocks_6[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_6[i] = create_each_block_6(child_ctx);
    						each_blocks_6[i].c();
    						each_blocks_6[i].m(article2, null);
    					}
    				}

    				for (; i < each_blocks_6.length; i += 1) {
    					each_blocks_6[i].d(1);
    				}

    				each_blocks_6.length = each_value_6.length;
    			}

    			if (dirty[0] & /*bBasis*/ 4) {
    				each_value_5 = /*bBasis*/ ctx[2];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_5[i]) {
    						each_blocks_5[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_5[i] = create_each_block_5(child_ctx);
    						each_blocks_5[i].c();
    						each_blocks_5[i].m(article3, null);
    					}
    				}

    				for (; i < each_blocks_5.length; i += 1) {
    					each_blocks_5[i].d(1);
    				}

    				each_blocks_5.length = each_value_5.length;
    			}

    			if (dirty[0] & /*bStr*/ 16) {
    				each_value_4 = /*bStr*/ ctx[4];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_4(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(article4, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_4.length;
    			}

    			if (dirty[0] & /*baseCheck*/ 32) {
    				each_value_3 = /*baseCheck*/ ctx[5];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(article5, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*baseCheck, aStr*/ 33) {
    				each_value_2 = /*baseCheck*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(article6, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*eveCheck*/ 64) {
    				each_value_1 = /*eveCheck*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(article7, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*final*/ 128) {
    				each_value = /*final*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_8, detaching);
    			destroy_each(each_blocks_7, detaching);
    			destroy_each(each_blocks_6, detaching);
    			destroy_each(each_blocks_5, detaching);
    			destroy_each(each_blocks_4, detaching);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = x => x == 1;
    const func_1 = x => x == 1;
    const func_2 = x => x != -1;
    const func_3 = x => x != -1;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bbef", slots, []);
    	let keylen = 32;

    	const photonCalc = (el, i) => {
    		if (!el) {
    			if (!aStr[i]) return "0"; else return "90";
    		} else {
    			if (aStr[i]) return "45"; else return "-45";
    		}
    	};

    	const decoder = (el, i) => {
    		if (bBasis[i] != aBasis[i]) return Math.random() >= 0.5 ? 1 : 0;

    		if (!bBasis[i]) {
    			if (el == "0") return 0;
    			if (el == "90") return 1;
    		} else {
    			if (el == "-45") return 0;
    			if (el == "45") return 1;
    		}
    	};

    	let aStr = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let aBasis = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let bBasis = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let photons = aBasis.map(photonCalc);
    	let bStr = photons.map(decoder);
    	let baseCheck = bBasis.map((el, i) => el == aBasis[i] ? 1 : 0);
    	let eveCheck = baseCheck.map((el, i) => el && Math.round(Math.random()) ? aStr[i] : -1);
    	let final = baseCheck.map((el, i) => el && eveCheck[i] == -1 ? aStr[i] : -1);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bbef> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		keylen,
    		photonCalc,
    		decoder,
    		aStr,
    		aBasis,
    		bBasis,
    		photons,
    		bStr,
    		baseCheck,
    		eveCheck,
    		final
    	});

    	$$self.$inject_state = $$props => {
    		if ("keylen" in $$props) keylen = $$props.keylen;
    		if ("aStr" in $$props) $$invalidate(0, aStr = $$props.aStr);
    		if ("aBasis" in $$props) $$invalidate(1, aBasis = $$props.aBasis);
    		if ("bBasis" in $$props) $$invalidate(2, bBasis = $$props.bBasis);
    		if ("photons" in $$props) $$invalidate(3, photons = $$props.photons);
    		if ("bStr" in $$props) $$invalidate(4, bStr = $$props.bStr);
    		if ("baseCheck" in $$props) $$invalidate(5, baseCheck = $$props.baseCheck);
    		if ("eveCheck" in $$props) $$invalidate(6, eveCheck = $$props.eveCheck);
    		if ("final" in $$props) $$invalidate(7, final = $$props.final);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aStr, aBasis, bBasis, photons, bStr, baseCheck, eveCheck, final];
    }

    class Bbef extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bbef",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/bbefu.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/components/bbefu.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_5$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_6$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_7$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context_8$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    // (66:12) {#each aStr as aChar}
    function create_each_block_8$1(ctx) {
    	let div;
    	let t_value = /*aChar*/ ctx[33] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$3, 66, 16, 1805);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8$1.name,
    		type: "each",
    		source: "(66:12) {#each aStr as aChar}",
    		ctx
    	});

    	return block;
    }

    // (72:12) {#each aBasis as aBase}
    function create_each_block_7$1(ctx) {
    	let svg;
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");

    			attr_dev(path, "d", path_d_value = /*aBase*/ ctx[30]
    			? "M2 30 L30 2 M30 30 L2 2"
    			: "M16 2 L16 30 M2 16 L30 16");

    			add_location(path, file$3, 73, 20, 2035);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$3, 72, 16, 1972);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7$1.name,
    		type: "each",
    		source: "(72:12) {#each aBasis as aBase}",
    		ctx
    	});

    	return block;
    }

    // (81:12) {#each photons as photon}
    function create_each_block_6$1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M2 16 L30 16");
    			add_location(path, file$3, 85, 20, 2457);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			set_style(svg, "transform", "rotate(" + (/*photon*/ ctx[27] + "deg") + ")");
    			add_location(svg, file$3, 81, 16, 2291);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6$1.name,
    		type: "each",
    		source: "(81:12) {#each photons as photon}",
    		ctx
    	});

    	return block;
    }

    // (94:12) {#each bBasis as bBase}
    function create_each_block_5$1(ctx) {
    	let svg;
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");

    			attr_dev(path, "d", path_d_value = /*bBase*/ ctx[24]
    			? "M2 30 L30 2 M30 30 L2 2"
    			: "M16 2 L16 30 M2 16 L30 16");

    			add_location(path, file$3, 95, 20, 2788);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$3, 94, 16, 2725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5$1.name,
    		type: "each",
    		source: "(94:12) {#each bBasis as bBase}",
    		ctx
    	});

    	return block;
    }

    // (103:12) {#each bStr as bChar}
    function create_each_block_4$1(ctx) {
    	let div;
    	let t_value = /*bChar*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$3, 103, 16, 3043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(103:12) {#each bStr as bChar}",
    		ctx
    	});

    	return block;
    }

    // (109:12) {#each baseCheck as check}
    function create_each_block_3$1(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] ? "Y" : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$3, 109, 16, 3214);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(109:12) {#each baseCheck as check}",
    		ctx
    	});

    	return block;
    }

    // (120:12) {#each baseCheck as check, i}
    function create_each_block_2$1(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] ? /*aStr*/ ctx[0][/*i*/ ctx[18]] : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$3, 120, 16, 3641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(120:12) {#each baseCheck as check, i}",
    		ctx
    	});

    	return block;
    }

    // (126:12) {#each eveCheck as check}
    function create_each_block_1$1(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] == -1 ? "" : /*check*/ ctx[14]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$3, 126, 16, 3821);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(126:12) {#each eveCheck as check}",
    		ctx
    	});

    	return block;
    }

    // (135:12) {#each final as char}
    function create_each_block$1(ctx) {
    	let div;
    	let t_value = (/*char*/ ctx[11] == -1 ? "" : /*char*/ ctx[11]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$3, 135, 16, 4145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(135:12) {#each final as char}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let div0;
    	let t0;
    	let article0;
    	let t1;
    	let article1;
    	let t2;
    	let article2;
    	let t3;
    	let div1;
    	let t4;
    	let article3;
    	let t5;
    	let article4;
    	let t6;
    	let article5;
    	let t7;
    	let div2;
    	let t8;
    	let t9_value = /*baseCheck*/ ctx[5].filter(func$1).length + "";
    	let t9;
    	let t10;
    	let t11_value = /*aStr*/ ctx[0].length + "";
    	let t11;
    	let t12;
    	let t13_value = (/*baseCheck*/ ctx[5].filter(func_1$1).length / /*aStr*/ ctx[0].length * 100).toFixed(2) + "";
    	let t13;
    	let t14;
    	let article6;
    	let t15;
    	let article7;
    	let t16;
    	let t17_value = /*final*/ ctx[7].filter(func_2$1).length + "";
    	let t17;
    	let t18;
    	let t19_value = /*aStr*/ ctx[0].length + "";
    	let t19;
    	let t20;
    	let t21_value = (/*final*/ ctx[7].filter(func_3$1).length / /*aStr*/ ctx[0].length * 100).toFixed(2) + "";
    	let t21;
    	let t22;
    	let article8;
    	let each_value_8 = /*aStr*/ ctx[0];
    	validate_each_argument(each_value_8);
    	let each_blocks_8 = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks_8[i] = create_each_block_8$1(get_each_context_8$1(ctx, each_value_8, i));
    	}

    	let each_value_7 = /*aBasis*/ ctx[1];
    	validate_each_argument(each_value_7);
    	let each_blocks_7 = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks_7[i] = create_each_block_7$1(get_each_context_7$1(ctx, each_value_7, i));
    	}

    	let each_value_6 = /*photons*/ ctx[3];
    	validate_each_argument(each_value_6);
    	let each_blocks_6 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_6[i] = create_each_block_6$1(get_each_context_6$1(ctx, each_value_6, i));
    	}

    	let each_value_5 = /*bBasis*/ ctx[2];
    	validate_each_argument(each_value_5);
    	let each_blocks_5 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_5[i] = create_each_block_5$1(get_each_context_5$1(ctx, each_value_5, i));
    	}

    	let each_value_4 = /*bStr*/ ctx[4];
    	validate_each_argument(each_value_4);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_4[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*baseCheck*/ ctx[5];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*baseCheck*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*eveCheck*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*final*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			t0 = text("Alice's BitString\n        ");
    			article0 = element("article");

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].c();
    			}

    			t1 = text("\n        Alice's Bases\n        ");
    			article1 = element("article");

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].c();
    			}

    			t2 = text("\n        Photons Sent\n        ");
    			article2 = element("article");

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			t4 = text("Bob's Bases\n        ");
    			article3 = element("article");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t5 = text("\n        Bob's BitString\n        ");
    			article4 = element("article");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t6 = text("\n        Basis Matching\n        ");
    			article5 = element("article");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t7 = space();
    			div2 = element("div");
    			t8 = text("The Key: Lenth =\n        ");
    			t9 = text(t9_value);
    			t10 = text("/");
    			t11 = text(t11_value);
    			t12 = text("~\n        ");
    			t13 = text(t13_value);
    			t14 = text("%\n\n        ");
    			article6 = element("article");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t15 = text("\n        Eve Check\n        ");
    			article7 = element("article");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t16 = text("\n        Final Key\n        ");
    			t17 = text(t17_value);
    			t18 = text("/");
    			t19 = text(t19_value);
    			t20 = text("~\n        ");
    			t21 = text(t21_value);
    			t22 = text("%\n\n        ");
    			article8 = element("article");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(article0, "class", "svelte-oolxbf");
    			add_location(article0, file$3, 64, 8, 1745);
    			attr_dev(article1, "class", "svelte-oolxbf");
    			add_location(article1, file$3, 70, 8, 1910);
    			attr_dev(article2, "class", "svelte-oolxbf");
    			add_location(article2, file$3, 79, 8, 2227);
    			set_style(div0, "background", "#faf");
    			set_style(div0, "border-radius", "10px");
    			set_style(div0, "padding", "5px");
    			set_style(div0, "margin", "5px 0");
    			add_location(div0, file$3, 62, 4, 1636);
    			attr_dev(article3, "class", "svelte-oolxbf");
    			add_location(article3, file$3, 92, 8, 2663);
    			attr_dev(article4, "class", "svelte-oolxbf");
    			add_location(article4, file$3, 101, 8, 2983);
    			attr_dev(article5, "class", "svelte-oolxbf");
    			add_location(article5, file$3, 107, 8, 3149);
    			set_style(div1, "background", "#afa");
    			set_style(div1, "border-radius", "10px");
    			set_style(div1, "padding", "5px");
    			set_style(div1, "margin", "5px 0");
    			add_location(div1, file$3, 90, 4, 2560);
    			attr_dev(article6, "class", "svelte-oolxbf");
    			add_location(article6, file$3, 118, 8, 3573);
    			attr_dev(article7, "class", "svelte-oolxbf");
    			add_location(article7, file$3, 124, 8, 3757);
    			attr_dev(article8, "class", "svelte-oolxbf");
    			add_location(article8, file$3, 133, 8, 4085);
    			set_style(div2, "background", "#aaf");
    			set_style(div2, "border-radius", "10px");
    			set_style(div2, "padding", "5px");
    			set_style(div2, "margin", "5px 0");
    			add_location(div2, file$3, 113, 4, 3315);
    			attr_dev(section, "class", "svelte-oolxbf");
    			add_location(section, file$3, 61, 0, 1622);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, t0);
    			append_dev(div0, article0);

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].m(article0, null);
    			}

    			append_dev(div0, t1);
    			append_dev(div0, article1);

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].m(article1, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, article2);

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].m(article2, null);
    			}

    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, t4);
    			append_dev(div1, article3);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(article3, null);
    			}

    			append_dev(div1, t5);
    			append_dev(div1, article4);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(article4, null);
    			}

    			append_dev(div1, t6);
    			append_dev(div1, article5);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(article5, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, div2);
    			append_dev(div2, t8);
    			append_dev(div2, t9);
    			append_dev(div2, t10);
    			append_dev(div2, t11);
    			append_dev(div2, t12);
    			append_dev(div2, t13);
    			append_dev(div2, t14);
    			append_dev(div2, article6);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(article6, null);
    			}

    			append_dev(div2, t15);
    			append_dev(div2, article7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(article7, null);
    			}

    			append_dev(div2, t16);
    			append_dev(div2, t17);
    			append_dev(div2, t18);
    			append_dev(div2, t19);
    			append_dev(div2, t20);
    			append_dev(div2, t21);
    			append_dev(div2, t22);
    			append_dev(div2, article8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(article8, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aStr*/ 1) {
    				each_value_8 = /*aStr*/ ctx[0];
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8$1(ctx, each_value_8, i);

    					if (each_blocks_8[i]) {
    						each_blocks_8[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_8[i] = create_each_block_8$1(child_ctx);
    						each_blocks_8[i].c();
    						each_blocks_8[i].m(article0, null);
    					}
    				}

    				for (; i < each_blocks_8.length; i += 1) {
    					each_blocks_8[i].d(1);
    				}

    				each_blocks_8.length = each_value_8.length;
    			}

    			if (dirty[0] & /*aBasis*/ 2) {
    				each_value_7 = /*aBasis*/ ctx[1];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7$1(ctx, each_value_7, i);

    					if (each_blocks_7[i]) {
    						each_blocks_7[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_7[i] = create_each_block_7$1(child_ctx);
    						each_blocks_7[i].c();
    						each_blocks_7[i].m(article1, null);
    					}
    				}

    				for (; i < each_blocks_7.length; i += 1) {
    					each_blocks_7[i].d(1);
    				}

    				each_blocks_7.length = each_value_7.length;
    			}

    			if (dirty[0] & /*photons*/ 8) {
    				each_value_6 = /*photons*/ ctx[3];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6$1(ctx, each_value_6, i);

    					if (each_blocks_6[i]) {
    						each_blocks_6[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_6[i] = create_each_block_6$1(child_ctx);
    						each_blocks_6[i].c();
    						each_blocks_6[i].m(article2, null);
    					}
    				}

    				for (; i < each_blocks_6.length; i += 1) {
    					each_blocks_6[i].d(1);
    				}

    				each_blocks_6.length = each_value_6.length;
    			}

    			if (dirty[0] & /*bBasis*/ 4) {
    				each_value_5 = /*bBasis*/ ctx[2];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5$1(ctx, each_value_5, i);

    					if (each_blocks_5[i]) {
    						each_blocks_5[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_5[i] = create_each_block_5$1(child_ctx);
    						each_blocks_5[i].c();
    						each_blocks_5[i].m(article3, null);
    					}
    				}

    				for (; i < each_blocks_5.length; i += 1) {
    					each_blocks_5[i].d(1);
    				}

    				each_blocks_5.length = each_value_5.length;
    			}

    			if (dirty[0] & /*bStr*/ 16) {
    				each_value_4 = /*bStr*/ ctx[4];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_4$1(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(article4, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_4.length;
    			}

    			if (dirty[0] & /*baseCheck*/ 32) {
    				each_value_3 = /*baseCheck*/ ctx[5];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3$1(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(article5, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*baseCheck, aStr*/ 33) {
    				each_value_2 = /*baseCheck*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(article6, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*eveCheck*/ 64) {
    				each_value_1 = /*eveCheck*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(article7, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*final*/ 128) {
    				each_value = /*final*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_8, detaching);
    			destroy_each(each_blocks_7, detaching);
    			destroy_each(each_blocks_6, detaching);
    			destroy_each(each_blocks_5, detaching);
    			destroy_each(each_blocks_4, detaching);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$1 = x => x == 1;
    const func_1$1 = x => x == 1;
    const func_2$1 = x => x != -1;
    const func_3$1 = x => x != -1;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bbefu", slots, []);
    	let keylen = 128;

    	const photonCalc = (el, i) => {
    		if (!el) {
    			if (!aStr[i]) return "0"; else return "90";
    		} else {
    			if (aStr[i]) return "45"; else return "-45";
    		}
    	};

    	const decoder = (el, i) => {
    		if (bBasis[i] != aBasis[i]) return Math.random() >= 0.5 ? 1 : 0;

    		if (!bBasis[i]) {
    			if (el == "0") return 0;
    			if (el == "90") return 1;
    		} else {
    			if (el == "-45") return 0;
    			if (el == "45") return 1;
    		}
    	};

    	let aStr = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let aBasis = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let bBasis = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let photons = aBasis.map(photonCalc);
    	let bStr = photons.map(decoder);
    	let baseCheck = bBasis.map((el, i) => el == aBasis[i] ? 1 : 0);
    	let eveCheck = baseCheck.map((el, i) => el && Math.round(Math.random()) ? aStr[i] : -1);
    	let final = baseCheck.map((el, i) => el && eveCheck[i] == -1 ? aStr[i] : -1);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bbefu> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		keylen,
    		photonCalc,
    		decoder,
    		aStr,
    		aBasis,
    		bBasis,
    		photons,
    		bStr,
    		baseCheck,
    		eveCheck,
    		final
    	});

    	$$self.$inject_state = $$props => {
    		if ("keylen" in $$props) keylen = $$props.keylen;
    		if ("aStr" in $$props) $$invalidate(0, aStr = $$props.aStr);
    		if ("aBasis" in $$props) $$invalidate(1, aBasis = $$props.aBasis);
    		if ("bBasis" in $$props) $$invalidate(2, bBasis = $$props.bBasis);
    		if ("photons" in $$props) $$invalidate(3, photons = $$props.photons);
    		if ("bStr" in $$props) $$invalidate(4, bStr = $$props.bStr);
    		if ("baseCheck" in $$props) $$invalidate(5, baseCheck = $$props.baseCheck);
    		if ("eveCheck" in $$props) $$invalidate(6, eveCheck = $$props.eveCheck);
    		if ("final" in $$props) $$invalidate(7, final = $$props.final);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aStr, aBasis, bBasis, photons, bStr, baseCheck, eveCheck, final];
    }

    class Bbefu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bbefu",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/bbefuu.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/components/bbefuu.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context_3$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_4$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context_5$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_6$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_7$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    function get_each_context_8$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    // (66:12) {#each aStr as aChar}
    function create_each_block_8$2(ctx) {
    	let div;
    	let t_value = /*aChar*/ ctx[33] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$4, 66, 16, 1805);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_8$2.name,
    		type: "each",
    		source: "(66:12) {#each aStr as aChar}",
    		ctx
    	});

    	return block;
    }

    // (72:12) {#each aBasis as aBase}
    function create_each_block_7$2(ctx) {
    	let svg;
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");

    			attr_dev(path, "d", path_d_value = /*aBase*/ ctx[30]
    			? "M2 30 L30 2 M30 30 L2 2"
    			: "M16 2 L16 30 M2 16 L30 16");

    			add_location(path, file$4, 73, 20, 2035);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$4, 72, 16, 1972);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_7$2.name,
    		type: "each",
    		source: "(72:12) {#each aBasis as aBase}",
    		ctx
    	});

    	return block;
    }

    // (81:12) {#each photons as photon}
    function create_each_block_6$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M2 16 L30 16");
    			add_location(path, file$4, 85, 20, 2457);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			set_style(svg, "transform", "rotate(" + (/*photon*/ ctx[27] + "deg") + ")");
    			add_location(svg, file$4, 81, 16, 2291);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6$2.name,
    		type: "each",
    		source: "(81:12) {#each photons as photon}",
    		ctx
    	});

    	return block;
    }

    // (94:12) {#each bBasis as bBase}
    function create_each_block_5$2(ctx) {
    	let svg;
    	let path;
    	let path_d_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");

    			attr_dev(path, "d", path_d_value = /*bBase*/ ctx[24]
    			? "M2 30 L30 2 M30 30 L2 2"
    			: "M16 2 L16 30 M2 16 L30 16");

    			add_location(path, file$4, 95, 20, 2788);
    			attr_dev(svg, "class", "balancer svelte-oolxbf");
    			attr_dev(svg, "viewBox", "0 0 32 32");
    			add_location(svg, file$4, 94, 16, 2725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5$2.name,
    		type: "each",
    		source: "(94:12) {#each bBasis as bBase}",
    		ctx
    	});

    	return block;
    }

    // (103:12) {#each bStr as bChar}
    function create_each_block_4$2(ctx) {
    	let div;
    	let t_value = /*bChar*/ ctx[21] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$4, 103, 16, 3043);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$2.name,
    		type: "each",
    		source: "(103:12) {#each bStr as bChar}",
    		ctx
    	});

    	return block;
    }

    // (109:12) {#each baseCheck as check}
    function create_each_block_3$2(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] ? "Y" : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$4, 109, 16, 3214);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$2.name,
    		type: "each",
    		source: "(109:12) {#each baseCheck as check}",
    		ctx
    	});

    	return block;
    }

    // (120:12) {#each baseCheck as check, i}
    function create_each_block_2$2(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] ? /*aStr*/ ctx[0][/*i*/ ctx[18]] : "") + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$4, 120, 16, 3641);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(120:12) {#each baseCheck as check, i}",
    		ctx
    	});

    	return block;
    }

    // (126:12) {#each eveCheck as check}
    function create_each_block_1$2(ctx) {
    	let div;
    	let t_value = (/*check*/ ctx[14] == -1 ? "" : /*check*/ ctx[14]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$4, 126, 16, 3821);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(126:12) {#each eveCheck as check}",
    		ctx
    	});

    	return block;
    }

    // (135:12) {#each final as char}
    function create_each_block$2(ctx) {
    	let div;
    	let t_value = (/*char*/ ctx[11] == -1 ? "" : /*char*/ ctx[11]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "balancer svelte-oolxbf");
    			add_location(div, file$4, 135, 16, 4145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(135:12) {#each final as char}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let section;
    	let div0;
    	let t0;
    	let article0;
    	let t1;
    	let article1;
    	let t2;
    	let article2;
    	let t3;
    	let div1;
    	let t4;
    	let article3;
    	let t5;
    	let article4;
    	let t6;
    	let article5;
    	let t7;
    	let div2;
    	let t8;
    	let t9_value = /*baseCheck*/ ctx[5].filter(func$2).length + "";
    	let t9;
    	let t10;
    	let t11_value = /*aStr*/ ctx[0].length + "";
    	let t11;
    	let t12;
    	let t13_value = (/*baseCheck*/ ctx[5].filter(func_1$2).length / /*aStr*/ ctx[0].length * 100).toFixed(2) + "";
    	let t13;
    	let t14;
    	let article6;
    	let t15;
    	let article7;
    	let t16;
    	let t17_value = /*final*/ ctx[7].filter(func_2$2).length + "";
    	let t17;
    	let t18;
    	let t19_value = /*aStr*/ ctx[0].length + "";
    	let t19;
    	let t20;
    	let t21_value = (/*final*/ ctx[7].filter(func_3$2).length / /*aStr*/ ctx[0].length * 100).toFixed(2) + "";
    	let t21;
    	let t22;
    	let article8;
    	let each_value_8 = /*aStr*/ ctx[0];
    	validate_each_argument(each_value_8);
    	let each_blocks_8 = [];

    	for (let i = 0; i < each_value_8.length; i += 1) {
    		each_blocks_8[i] = create_each_block_8$2(get_each_context_8$2(ctx, each_value_8, i));
    	}

    	let each_value_7 = /*aBasis*/ ctx[1];
    	validate_each_argument(each_value_7);
    	let each_blocks_7 = [];

    	for (let i = 0; i < each_value_7.length; i += 1) {
    		each_blocks_7[i] = create_each_block_7$2(get_each_context_7$2(ctx, each_value_7, i));
    	}

    	let each_value_6 = /*photons*/ ctx[3];
    	validate_each_argument(each_value_6);
    	let each_blocks_6 = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks_6[i] = create_each_block_6$2(get_each_context_6$2(ctx, each_value_6, i));
    	}

    	let each_value_5 = /*bBasis*/ ctx[2];
    	validate_each_argument(each_value_5);
    	let each_blocks_5 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_5[i] = create_each_block_5$2(get_each_context_5$2(ctx, each_value_5, i));
    	}

    	let each_value_4 = /*bStr*/ ctx[4];
    	validate_each_argument(each_value_4);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_4[i] = create_each_block_4$2(get_each_context_4$2(ctx, each_value_4, i));
    	}

    	let each_value_3 = /*baseCheck*/ ctx[5];
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3$2(get_each_context_3$2(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*baseCheck*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*eveCheck*/ ctx[6];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*final*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			div0 = element("div");
    			t0 = text("Alice's BitString\n        ");
    			article0 = element("article");

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].c();
    			}

    			t1 = text("\n        Alice's Bases\n        ");
    			article1 = element("article");

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].c();
    			}

    			t2 = text("\n        Photons Sent\n        ");
    			article2 = element("article");

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].c();
    			}

    			t3 = space();
    			div1 = element("div");
    			t4 = text("Bob's Bases\n        ");
    			article3 = element("article");

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].c();
    			}

    			t5 = text("\n        Bob's BitString\n        ");
    			article4 = element("article");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t6 = text("\n        Basis Matching\n        ");
    			article5 = element("article");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t7 = space();
    			div2 = element("div");
    			t8 = text("The Key: Lenth =\n        ");
    			t9 = text(t9_value);
    			t10 = text("/");
    			t11 = text(t11_value);
    			t12 = text("~\n        ");
    			t13 = text(t13_value);
    			t14 = text("%\n\n        ");
    			article6 = element("article");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t15 = text("\n        Eve Check\n        ");
    			article7 = element("article");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t16 = text("\n        Final Key\n        ");
    			t17 = text(t17_value);
    			t18 = text("/");
    			t19 = text(t19_value);
    			t20 = text("~\n        ");
    			t21 = text(t21_value);
    			t22 = text("%\n\n        ");
    			article8 = element("article");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(article0, "class", "svelte-oolxbf");
    			add_location(article0, file$4, 64, 8, 1745);
    			attr_dev(article1, "class", "svelte-oolxbf");
    			add_location(article1, file$4, 70, 8, 1910);
    			attr_dev(article2, "class", "svelte-oolxbf");
    			add_location(article2, file$4, 79, 8, 2227);
    			set_style(div0, "background", "#faf");
    			set_style(div0, "border-radius", "10px");
    			set_style(div0, "padding", "5px");
    			set_style(div0, "margin", "5px 0");
    			add_location(div0, file$4, 62, 4, 1636);
    			attr_dev(article3, "class", "svelte-oolxbf");
    			add_location(article3, file$4, 92, 8, 2663);
    			attr_dev(article4, "class", "svelte-oolxbf");
    			add_location(article4, file$4, 101, 8, 2983);
    			attr_dev(article5, "class", "svelte-oolxbf");
    			add_location(article5, file$4, 107, 8, 3149);
    			set_style(div1, "background", "#afa");
    			set_style(div1, "border-radius", "10px");
    			set_style(div1, "padding", "5px");
    			set_style(div1, "margin", "5px 0");
    			add_location(div1, file$4, 90, 4, 2560);
    			attr_dev(article6, "class", "svelte-oolxbf");
    			add_location(article6, file$4, 118, 8, 3573);
    			attr_dev(article7, "class", "svelte-oolxbf");
    			add_location(article7, file$4, 124, 8, 3757);
    			attr_dev(article8, "class", "svelte-oolxbf");
    			add_location(article8, file$4, 133, 8, 4085);
    			set_style(div2, "background", "#aaf");
    			set_style(div2, "border-radius", "10px");
    			set_style(div2, "padding", "5px");
    			set_style(div2, "margin", "5px 0");
    			add_location(div2, file$4, 113, 4, 3315);
    			attr_dev(section, "class", "svelte-oolxbf");
    			add_location(section, file$4, 61, 0, 1622);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div0);
    			append_dev(div0, t0);
    			append_dev(div0, article0);

    			for (let i = 0; i < each_blocks_8.length; i += 1) {
    				each_blocks_8[i].m(article0, null);
    			}

    			append_dev(div0, t1);
    			append_dev(div0, article1);

    			for (let i = 0; i < each_blocks_7.length; i += 1) {
    				each_blocks_7[i].m(article1, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, article2);

    			for (let i = 0; i < each_blocks_6.length; i += 1) {
    				each_blocks_6[i].m(article2, null);
    			}

    			append_dev(section, t3);
    			append_dev(section, div1);
    			append_dev(div1, t4);
    			append_dev(div1, article3);

    			for (let i = 0; i < each_blocks_5.length; i += 1) {
    				each_blocks_5[i].m(article3, null);
    			}

    			append_dev(div1, t5);
    			append_dev(div1, article4);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(article4, null);
    			}

    			append_dev(div1, t6);
    			append_dev(div1, article5);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(article5, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, div2);
    			append_dev(div2, t8);
    			append_dev(div2, t9);
    			append_dev(div2, t10);
    			append_dev(div2, t11);
    			append_dev(div2, t12);
    			append_dev(div2, t13);
    			append_dev(div2, t14);
    			append_dev(div2, article6);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(article6, null);
    			}

    			append_dev(div2, t15);
    			append_dev(div2, article7);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(article7, null);
    			}

    			append_dev(div2, t16);
    			append_dev(div2, t17);
    			append_dev(div2, t18);
    			append_dev(div2, t19);
    			append_dev(div2, t20);
    			append_dev(div2, t21);
    			append_dev(div2, t22);
    			append_dev(div2, article8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(article8, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*aStr*/ 1) {
    				each_value_8 = /*aStr*/ ctx[0];
    				validate_each_argument(each_value_8);
    				let i;

    				for (i = 0; i < each_value_8.length; i += 1) {
    					const child_ctx = get_each_context_8$2(ctx, each_value_8, i);

    					if (each_blocks_8[i]) {
    						each_blocks_8[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_8[i] = create_each_block_8$2(child_ctx);
    						each_blocks_8[i].c();
    						each_blocks_8[i].m(article0, null);
    					}
    				}

    				for (; i < each_blocks_8.length; i += 1) {
    					each_blocks_8[i].d(1);
    				}

    				each_blocks_8.length = each_value_8.length;
    			}

    			if (dirty[0] & /*aBasis*/ 2) {
    				each_value_7 = /*aBasis*/ ctx[1];
    				validate_each_argument(each_value_7);
    				let i;

    				for (i = 0; i < each_value_7.length; i += 1) {
    					const child_ctx = get_each_context_7$2(ctx, each_value_7, i);

    					if (each_blocks_7[i]) {
    						each_blocks_7[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_7[i] = create_each_block_7$2(child_ctx);
    						each_blocks_7[i].c();
    						each_blocks_7[i].m(article1, null);
    					}
    				}

    				for (; i < each_blocks_7.length; i += 1) {
    					each_blocks_7[i].d(1);
    				}

    				each_blocks_7.length = each_value_7.length;
    			}

    			if (dirty[0] & /*photons*/ 8) {
    				each_value_6 = /*photons*/ ctx[3];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6$2(ctx, each_value_6, i);

    					if (each_blocks_6[i]) {
    						each_blocks_6[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_6[i] = create_each_block_6$2(child_ctx);
    						each_blocks_6[i].c();
    						each_blocks_6[i].m(article2, null);
    					}
    				}

    				for (; i < each_blocks_6.length; i += 1) {
    					each_blocks_6[i].d(1);
    				}

    				each_blocks_6.length = each_value_6.length;
    			}

    			if (dirty[0] & /*bBasis*/ 4) {
    				each_value_5 = /*bBasis*/ ctx[2];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5$2(ctx, each_value_5, i);

    					if (each_blocks_5[i]) {
    						each_blocks_5[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_5[i] = create_each_block_5$2(child_ctx);
    						each_blocks_5[i].c();
    						each_blocks_5[i].m(article3, null);
    					}
    				}

    				for (; i < each_blocks_5.length; i += 1) {
    					each_blocks_5[i].d(1);
    				}

    				each_blocks_5.length = each_value_5.length;
    			}

    			if (dirty[0] & /*bStr*/ 16) {
    				each_value_4 = /*bStr*/ ctx[4];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$2(ctx, each_value_4, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_4$2(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(article4, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_4.length;
    			}

    			if (dirty[0] & /*baseCheck*/ 32) {
    				each_value_3 = /*baseCheck*/ ctx[5];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$2(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3$2(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(article5, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty[0] & /*baseCheck, aStr*/ 33) {
    				each_value_2 = /*baseCheck*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(article6, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty[0] & /*eveCheck*/ 64) {
    				each_value_1 = /*eveCheck*/ ctx[6];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(article7, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*final*/ 128) {
    				each_value = /*final*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article8, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_8, detaching);
    			destroy_each(each_blocks_7, detaching);
    			destroy_each(each_blocks_6, detaching);
    			destroy_each(each_blocks_5, detaching);
    			destroy_each(each_blocks_4, detaching);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func$2 = x => x == 1;
    const func_1$2 = x => x == 1;
    const func_2$2 = x => x != -1;
    const func_3$2 = x => x != -1;

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Bbefuu", slots, []);
    	let keylen = 512;

    	const photonCalc = (el, i) => {
    		if (!el) {
    			if (!aStr[i]) return "0"; else return "90";
    		} else {
    			if (aStr[i]) return "45"; else return "-45";
    		}
    	};

    	const decoder = (el, i) => {
    		if (bBasis[i] != aBasis[i]) return Math.random() >= 0.5 ? 1 : 0;

    		if (!bBasis[i]) {
    			if (el == "0") return 0;
    			if (el == "90") return 1;
    		} else {
    			if (el == "-45") return 0;
    			if (el == "45") return 1;
    		}
    	};

    	let aStr = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let aBasis = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let bBasis = new Array(keylen).fill(1).map(x => Math.random() >= 0.5 ? 1 : 0);
    	let photons = aBasis.map(photonCalc);
    	let bStr = photons.map(decoder);
    	let baseCheck = bBasis.map((el, i) => el == aBasis[i] ? 1 : 0);
    	let eveCheck = baseCheck.map((el, i) => el && Math.round(Math.random()) ? aStr[i] : -1);
    	let final = baseCheck.map((el, i) => el && eveCheck[i] == -1 ? aStr[i] : -1);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Bbefuu> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		keylen,
    		photonCalc,
    		decoder,
    		aStr,
    		aBasis,
    		bBasis,
    		photons,
    		bStr,
    		baseCheck,
    		eveCheck,
    		final
    	});

    	$$self.$inject_state = $$props => {
    		if ("keylen" in $$props) keylen = $$props.keylen;
    		if ("aStr" in $$props) $$invalidate(0, aStr = $$props.aStr);
    		if ("aBasis" in $$props) $$invalidate(1, aBasis = $$props.aBasis);
    		if ("bBasis" in $$props) $$invalidate(2, bBasis = $$props.bBasis);
    		if ("photons" in $$props) $$invalidate(3, photons = $$props.photons);
    		if ("bStr" in $$props) $$invalidate(4, bStr = $$props.bStr);
    		if ("baseCheck" in $$props) $$invalidate(5, baseCheck = $$props.baseCheck);
    		if ("eveCheck" in $$props) $$invalidate(6, eveCheck = $$props.eveCheck);
    		if ("final" in $$props) $$invalidate(7, final = $$props.final);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aStr, aBasis, bBasis, photons, bStr, baseCheck, eveCheck, final];
    }

    class Bbefuu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bbefuu",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/pns.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/components/pns.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (48:8) {:else}
    function create_else_block(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "id", "photon1");
    			attr_dev(circle, "cx", "60");
    			attr_dev(circle, "cy", "320");
    			attr_dev(circle, "r", "5");
    			attr_dev(circle, "fill", "#fff");
    			set_style(circle, "animation-delay", 2 * /*i*/ ctx[4] + "s");
    			attr_dev(circle, "class", "svelte-j8z77p");
    			add_location(circle, file$5, 48, 12, 1105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(48:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:8) {#if eve}
    function create_if_block(ctx) {
    	let circle;

    	const block = {
    		c: function create() {
    			circle = svg_element("circle");
    			attr_dev(circle, "id", "eve");
    			attr_dev(circle, "cx", "60");
    			attr_dev(circle, "cy", "320");
    			attr_dev(circle, "r", "5");
    			attr_dev(circle, "fill", "#fff");
    			set_style(circle, "animation-delay", 2 * /*i*/ ctx[4] + "s");
    			attr_dev(circle, "class", "svelte-j8z77p");
    			add_location(circle, file$5, 40, 12, 888);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, circle, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:8) {#if eve}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#each Array(5) as __dirname, i}
    function create_each_block$3(ctx) {
    	let circle0;
    	let circle1;

    	function select_block_type(ctx, dirty) {
    		if (/*eve*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			attr_dev(circle0, "id", "photon2");
    			attr_dev(circle0, "cx", "50");
    			attr_dev(circle0, "cy", "325");
    			attr_dev(circle0, "r", "5");
    			attr_dev(circle0, "fill", "#fff");
    			set_style(circle0, "animation-delay", 2 * /*i*/ ctx[4] + "s");
    			attr_dev(circle0, "class", "svelte-j8z77p");
    			add_location(circle0, file$5, 56, 8, 1320);
    			attr_dev(circle1, "id", "photon3");
    			attr_dev(circle1, "cx", "61");
    			attr_dev(circle1, "cy", "332");
    			attr_dev(circle1, "r", "5");
    			attr_dev(circle1, "fill", "#fff");
    			set_style(circle1, "animation-delay", 2 * /*i*/ ctx[4] + "s");
    			attr_dev(circle1, "class", "svelte-j8z77p");
    			add_location(circle1, file$5, 63, 8, 1497);
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, circle0, anchor);
    			insert_dev(target, circle1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(circle0.parentNode, circle0);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(circle0);
    			if (detaching) detach_dev(circle1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(39:4) {#each Array(5) as __dirname, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let button;
    	let t1;
    	let svg;
    	let rect0;
    	let rect1;
    	let rect2;
    	let rect3;
    	let rect4;
    	let mounted;
    	let dispose;
    	let each_value = Array(5);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Toggel Eve";
    			t1 = space();
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			rect2 = svg_element("rect");
    			rect3 = svg_element("rect");
    			rect4 = svg_element("rect");
    			add_location(button, file$5, 32, 0, 551);
    			attr_dev(rect0, "x", "50");
    			attr_dev(rect0, "y", "300");
    			attr_dev(rect0, "height", "50");
    			attr_dev(rect0, "width", "400");
    			attr_dev(rect0, "rx", "5");
    			attr_dev(rect0, "fill", "#444");
    			add_location(rect0, file$5, 35, 4, 659);
    			attr_dev(rect1, "x", "220");
    			attr_dev(rect1, "y", "200");
    			attr_dev(rect1, "height", "120");
    			attr_dev(rect1, "width", "50");
    			attr_dev(rect1, "rx", "5");
    			attr_dev(rect1, "fill", "#444");
    			add_location(rect1, file$5, 36, 4, 730);
    			attr_dev(rect2, "x", "5");
    			attr_dev(rect2, "y", "295");
    			attr_dev(rect2, "height", "60");
    			attr_dev(rect2, "width", "60");
    			attr_dev(rect2, "rx", "5");
    			attr_dev(rect2, "fill", "#faa");
    			add_location(rect2, file$5, 71, 4, 1682);
    			attr_dev(rect3, "x", "440");
    			attr_dev(rect3, "y", "295");
    			attr_dev(rect3, "height", "60");
    			attr_dev(rect3, "width", "60");
    			attr_dev(rect3, "rx", "5");
    			attr_dev(rect3, "fill", "#afa");
    			add_location(rect3, file$5, 72, 4, 1751);
    			attr_dev(rect4, "x", "215");
    			attr_dev(rect4, "y", "145");
    			attr_dev(rect4, "height", "60");
    			attr_dev(rect4, "width", "60");
    			attr_dev(rect4, "rx", "5");
    			attr_dev(rect4, "fill", "#aaf");
    			add_location(rect4, file$5, 73, 4, 1822);
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			attr_dev(svg, "class", "svelte-j8z77p");
    			add_location(svg, file$5, 33, 0, 609);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, svg, anchor);
    			append_dev(svg, rect0);
    			append_dev(svg, rect1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			append_dev(svg, rect2);
    			append_dev(svg, rect3);
    			append_dev(svg, rect4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*eve*/ 1) {
    				each_value = Array(5);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(svg, rect2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(svg);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pns", slots, []);
    	let eve = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pns> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, eve = !eve);
    	$$self.$capture_state = () => ({ eve });

    	$$self.$inject_state = $$props => {
    		if ("eve" in $$props) $$invalidate(0, eve = $$props.eve);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [eve, click_handler];
    }

    class Pns extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pns",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */

    const { Object: Object_1 } = globals;
    const file$6 = "src/App.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i][0];
    	child_ctx[5] = list[i][1];
    	return child_ctx;
    }

    // (51:2) {#each Object.entries(cpts) as [Key, Value]}
    function create_each_block$4(ctx) {
    	let li;
    	let t_value = /*Key*/ ctx[4] + "";
    	let t;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(/*activer*/ ctx[1]) + " svelte-wmnzdl"));
    			add_location(li, file$6, 51, 3, 1110);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*handle*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(51:2) {#each Object.entries(cpts) as [Key, Value]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let header;
    	let ul;
    	let t0;
    	let main;
    	let switch_instance;
    	let t1;
    	let footer;
    	let a;
    	let current;
    	let each_value = Object.entries(/*cpts*/ ctx[3]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	var switch_value = /*state*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t1 = space();
    			footer = element("footer");
    			a = element("a");
    			a.textContent = "A @plutonium project";
    			attr_dev(ul, "class", "svelte-wmnzdl");
    			add_location(ul, file$6, 49, 1, 1055);
    			attr_dev(header, "class", "svelte-wmnzdl");
    			add_location(header, file$6, 48, 0, 1045);
    			add_location(main, file$6, 55, 0, 1186);
    			attr_dev(a, "href", "https://me.nukes.in");
    			add_location(a, file$6, 58, 8, 1244);
    			attr_dev(footer, "class", "svelte-wmnzdl");
    			add_location(footer, file$6, 58, 0, 1236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, a);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activer, handle, Object, cpts*/ 14) {
    				each_value = Object.entries(/*cpts*/ ctx[3]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (switch_value !== (switch_value = /*state*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const activer = e => {
    		return e.target.innerText == state ? "active" : "";
    	};

    	const handle = e => {
    		$$invalidate(0, state = cpts[e.target.innerText]);
    	};

    	const cpts = {
    		DH: Dh,
    		MANIM: ManIM,
    		BB84_32: Bbef,
    		BB84_128: Bbefu,
    		BB84_512: Bbefuu,
    		PNS: Pns
    	};

    	let state = cpts["PNS"];
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		DH: Dh,
    		MANIM: ManIM,
    		BB84: Bbef,
    		BB84U: Bbefu,
    		BB84UU: Bbefuu,
    		PNS: Pns,
    		activer,
    		handle,
    		cpts,
    		state
    	});

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [state, activer, handle, cpts];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App( { target: document.body } );

    return app;

}());
