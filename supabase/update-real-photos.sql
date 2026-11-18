-- صور نسيان الحقيقية: شغّليه مرة واحدة في SQL Editor
update public.products set gallery = '/media/posters/naxos-gold-1.webp
/media/posters/naxos-gold-2.webp
/media/posters/naxos-1.webp
/media/posters/naxos-4.webp
/media/posters/naxos-2.webp
/media/posters/naxos-3.webp
/products/naxos-duo.webp
/media/posters/naxos.webp
/media/posters/real-pouch.webp
/media/posters/real-grid.webp' where slug = 'naxos';
update public.products set gallery = '/media/posters/paradigme-1.webp
/products/paradigme-duo.webp
/media/posters/paradigme.webp
/media/posters/real-pouch.webp
/media/posters/real-grid.webp' where slug = 'paradigme';
update public.products set gallery = '/media/posters/40-knots-1.webp
/products/40-knots-duo.webp
/media/posters/40-knots.webp
/media/posters/real-pouch.webp
/media/posters/real-grid.webp' where slug = '40-knots';
update public.products set gallery = '/products/arabians-tonka-duo.webp
/media/posters/arabians-tonka.webp
/media/posters/real-pouch.webp
/media/posters/real-grid.webp' where slug = 'arabians-tonka';
update public.products set gallery = '/media/posters/real-valentino.webp
/products/born-in-roma-duo.webp' where slug = 'born-in-roma';
update public.products set gallery = '/media/posters/real-valentino.webp
/products/born-in-roma-intense-duo.webp' where slug = 'born-in-roma-intense';
update public.products set gallery = '/media/posters/real-trio.webp
/media/posters/scandal-1.webp
/products/scandal-duo.webp' where slug = 'scandal';
update public.blocks set data = data || '{"images":"/media/hero-4.webp\n/media/hero-1.webp\n/media/hero-2.webp\n/media/hero-3.webp","mobile_images":"/media/hero-4-m.webp","slides_ar":"عطور نسيان | زجاجة شفافة .. وعطر لا يُنسى\nمجموعة نسيان | لحظات لا تُنسى برائحة تدوم\nناكسوس | فخامة إيطالية .. الدخان والعسل والفواكه الراقية\nفورتي نوتس | رحلة بحرية .. حيث يلتقي البحر بالحرية","slides_en":"Nesyan perfumes | Clear glass .. an unforgettable scent\nThe Nesyan collection | Unforgettable moments, a lasting scent\nNaxos | Italian luxury — smoke, honey and fine fruits\n40 Knots | A sea voyage — where the sea meets freedom","links":"/shop\n/shop\n/p/naxos\n/p/40-knots"}'::jsonb, updated_at = now() where key = 'hero';
