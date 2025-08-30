import { prisma } from '../config/database.js';

// Tạo các bài viết mặc định khi server khởi động
export async function initializeDefaultPosts() {
    try {
        // Tạo post "home"
        const homeExist = await prisma.post.findUnique({ where: { slug: 'home' } });
        if (!homeExist) {
            await prisma.post.create({
                data: {
                    title: 'Trang chủ',
                    slug: 'home',
                    status: 'ACTIVE'
                }
            });
            console.log('Đã tạo post home trong database');
        }

        // Tạo bài viết TypeScript có sẵn
        const typescriptExist = await prisma.post.findUnique({ where: { slug: 'typescript-la-gi' } });
        if (!typescriptExist) {
            await prisma.post.create({
                data: {
                    title: 'Typescript là gì? Vì sao TypeScript là lựa chọn hàng đầu cho Dự án lớn',
                    slug: 'typescript-la-gi',
                    authorName: 'StudyBlog',
                    authorUrl: 'mailto:admin@studyblog.com',
                    excerpt: 'TypeScript (TS) không phải là "một ngôn ngữ mới lạ" bên cạnh JavaScript (JS) — nó là một siêu ngôn ngữ của JS: thêm hệ thống kiểu tĩnh, công cụ phân tích mã, và trải nghiệm IDE tốt hơn.',
                    lead: `<p class="lead">
                    TypeScript (TS) không phải là "một ngôn ngữ mới lạ" bên cạnh JavaScript (JS) — nó là một siêu
                    ngôn ngữ của JS: thêm hệ thống kiểu tĩnh, công cụ phân tích mã, và trải nghiệm IDE tốt hơn, rồi
                    biên dịch (transpile) về JS chạy ở mọi nơi JS chạy được.
                </p>
                <p>TypeScript ra đời để giải quyết vấn đề gì?</p>
                <p>
                    JavaScript tuyệt vời cho MVP và kịch bản ngắn. Nhưng khi ứng dụng phình to (nhiều module, nhiều
                    dev, vòng đời dài), JS thuần dễ sinh lỗi do:
                </p>
                <p>
                <ol>
                    <li>Không có kiểm tra kiểu tĩnh → bug chỉ lộ ở runtime.</li>
                    <li>Refactor rủi ro (đổi tên, đổi chữ ký hàm, tái cấu trúc) → thiếu "lan tỏa an toàn".</li>
                    <li>Thiếu "hợp đồng" giữa module/team → hiểu nhầm kiểu dữ liệu, API.</li>
                </ol>
                </p>
                <p> TypeScript xuất hiện (Microsoft, do Anders Hejlsberg dẫn dắt) để: <br>
                <ol>
                    <li>Thêm an toàn kiểu tĩnh nhưng vẫn giữ tính linh hoạt của JS.</li>
                    <li>Tận dụng hệ sinh thái JS nguyên vẹn (npm, Node, trình duyệt).</li>
                    <li>Nâng DPI cho IDE (tự hoàn thành, nhảy định nghĩa, rename symbol, quick-fix…).</li>
                </ol>
                </p>
                <h2>Điểm mạnh của TypeScript</h2>
                <p><strong>I. An toàn kiểu & tự tin khi refactor</strong>
                <ol>
                    <li>Kiểu tĩnh bắt lỗi sớm, refactor an toàn hơn.</li>
                    <li>Discriminated union + control-flow narrowing cho logic nhánh cực rõ.</li>
                </ol>
                </p>
                <h2>Điểm yếu / hạn chế</h2>
                <p class="lead">1. Cần bước biên dịch <br>
                    Thêm độ trễ build, cấu hình (tsconfig, bundler) và xử lý lỗi type.</p>
                <p class="lead">2. Kiểu bị xóa ở runtime <br>
                    TS không kiểm tra kiểu lúc chạy. Nếu dữ liệu từ API "bẩn", bạn cần validation runtime
                    (Zod/Valibot/io-ts…).</p>
                <h2>Ứng dụng thực tế</h2>
                <h3>Frontend</h3>
                <p>
                <ol>
                    <li><strong>React + TypeScript</strong>(Next.js, Vite): mặc định hiện đại, DX tốt.</li>
                    <li><strong>Angular</strong>: TypeScript là "công dân hạng nhất".</li>
                    <li><strong>Vue 3</strong>: hỗ trợ TS tốt với Volar, defineComponent </li>
                    <li><strong>Svelte/SvelteKit</strong>: bật TS dễ dàng.</li>
                </ol>
                </p>`,
                    publishedAt: new Date('2025-01-15'),
                    status: 'ACTIVE'
                }
            });
            console.log('Đã tạo bài viết TypeScript trong database');
        }

        // Tạo thêm một số bài viết mẫu
        const samplePosts = [
            {
                title: 'Node.js & Express: Xây Dựng Backend Linh Hoạt Và Hiệu Quả',
                slug: 'nodejs-express-backend',
                excerpt: 'Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng ứng dụng nhanh và hiệu quả. Express là framework tối giản giúp tạo API.',
                content: `<p class="lead">Node.js là môi trường chạy JavaScript phía server, cho phép xây dựng ứng dụng nhanh và hiệu quả. Express là framework tối giản giúp tạo API, quản lý routing và middleware một cách rõ ràng, gọn nhẹ.</p>
            <h2>Ưu điểm của Node.js</h2>
            <p>Node.js có nhiều ưu điểm vượt trội:</p>
            <ul>
                <li>Non-blocking I/O: Xử lý nhiều request đồng thời</li>
                <li>Event-driven: Hiệu suất cao với ít tài nguyên</li>
                <li>NPM ecosystem: Thư viện phong phú</li>
                <li>JavaScript everywhere: Cùng ngôn ngữ frontend và backend</li>
            </ul>`
            },
            {
                title: 'ReactJS: Từ Cơ Bản Đến Nâng Cao',
                slug: 'reactjs-tu-co-ban-den-nang-cao',
                excerpt: 'React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Học React từ cơ bản đến nâng cao.',
                content: `<p class="lead">React là thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng. Được phát triển bởi Facebook, React đã trở thành tiêu chuẩn trong phát triển frontend.</p>
            <h2>Core Concepts</h2>
            <p>React dựa trên các khái niệm cốt lõi:</p>
            <ul>
                <li>Components: Tái sử dụng và modular</li>
                <li>Props: Truyền dữ liệu từ parent xuống child</li>
                <li>State: Quản lý trạng thái component</li>
                <li>Virtual DOM: Tối ưu hiệu suất render</li>
            </ul>`
            },
            {
                title: 'TailwindCSS: Thiết Kế Giao Diện Nhanh, Gọn, Đẹp',
                slug: 'tailwindcss-thiet-ke-giao-dien',
                excerpt: 'Tailwind CSS là framework CSS utility-first giúp bạn xây dựng giao diện nhanh chóng với các class có sẵn.',
                content: `<p class="lead">Tailwind CSS là framework CSS utility-first giúp bạn xây dựng giao diện nhanh chóng với các class có sẵn. Thay vì viết CSS tùy chỉnh, bạn sử dụng các utility class.</p>
            <h2>Ưu điểm của Tailwind</h2>
            <p>Tailwind CSS mang lại nhiều lợi ích:</p>
            <ul>
                <li>Rapid development: Phát triển nhanh với utility classes</li>
                <li>Consistent design: Thiết kế nhất quán</li>
                <li>Responsive: Tích hợp responsive design</li>
                <li>Customizable: Dễ dàng tùy chỉnh theme</li>
            </ul>`
            }
        ];

        for (const postData of samplePosts) {
            const exist = await prisma.post.findUnique({ where: { slug: postData.slug } });
            if (!exist) {
                await prisma.post.create({
                    data: {
                        title: postData.title,
                        slug: postData.slug,
                        authorName: 'StudyBlog',
                        authorUrl: 'mailto:admin@studyblog.com',
                        excerpt: postData.excerpt,
                        lead: postData.content,
                        publishedAt: new Date('2025-01-15'),
                        status: 'ACTIVE'
                    }
                });
                console.log(`Đã tạo bài viết: ${postData.title}`);
            }
        }
    } catch (error) {
        console.error('Lỗi khởi tạo dữ liệu mặc định:', error);
    }
}
