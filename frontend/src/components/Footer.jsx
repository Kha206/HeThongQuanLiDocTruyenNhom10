import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0A0A0E] border-t border-[#2A2A38] text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: Platform Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center">
              <span className="bg-[#ED1D24] text-white font-extrabold text-xl px-2.5 py-1 tracking-tighter uppercase">
                MARVEL
              </span>
              <span className="ml-2 font-bold tracking-wider text-sm text-gray-200 uppercase">
                COMICS HUB
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Nền tảng đọc truyện tranh Marvel trực tuyến đỉnh cao dành cho người hâm mộ vũ trụ điện ảnh và truyện tranh. Trải nghiệm không gian 3D WebGL sống động và thư viện truyện đồ sộ.
            </p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Dự án CNPM Nâng Cao (Nhóm 10)</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Điều Hướng</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#hero-3d" className="hover:text-[#ED1D24] transition-colors">Vũ Trụ 3D Hero</Link>
              </li>
              <li>
                <Link to="/stories" className="hover:text-[#ED1D24] transition-colors">Tất Cả Truyện</Link>
              </li>
              <li>
                <Link to="/subscriptions" className="hover:text-[#ED1D24] transition-colors">Gói Hội Viên VIP</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Data Source Credit - MANDATORY REQUIREMENT */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Nguồn Dữ Liệu</h4>
            <div className="bg-[#1A1A22] p-4 rounded-xl border border-[#2A2A38] space-y-2">
              <p className="text-xs text-gray-300 font-medium">
                Dữ liệu truyện cung cấp bởi{' '}
                <a
                  href="https://comicvine.gamespot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ED1D24] hover:text-[#ff4d4d] underline font-bold inline-flex items-center gap-1"
                >
                  Comic Vine <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
              <p className="text-[11px] text-gray-500">
                Toàn bộ metadata, bìa ấn phẩm và danh mục tác phẩm thuộc bản quyền của Marvel Entertainment & Comic Vine Gamespot.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1F1F2A] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Marvel Comics Hub (Nhóm 10). Mọi quyền được bảo lưu.</p>
          <div className="flex items-center gap-1">
            <span>Phát triển bằng tâm huyết với</span>
            <Heart className="w-3.5 h-3.5 text-[#ED1D24] fill-[#ED1D24]" />
            <span>và công nghệ Three.js + React</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
