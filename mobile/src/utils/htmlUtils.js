/**
 * Tiện ích xử lý nội dung văn bản / HTML của chương truyện
 * 
 * LÝ DO KHÔNG DÙNG THƯ VIỆN NGOÀI:
 * - ComicVine và CMS lưu trữ phần tóm tắt/nội dung chương chủ yếu là văn bản hoặc đoạn <p>/<br>.
 * - Sử dụng hàm parse gọn nhẹ bằng biểu thức chính quy (regex) thuần túy giúp ứng dụng:
 *   1. Siêu nhẹ, khởi động nhanh, không phụ thuộc thư viện native nặng nề (như WebView hay react-native-render-html).
 *   2. Tương thích 100% với Expo SDK 58 và React 19 mà không lo xung đột dependency.
 *   3. Kiểm soát hoàn toàn kiểu dáng font chữ Merriweather, line-height và màu sắc chuẩn Dark Theme Marvel.
 */

/**
 * Phân tích và làm sạch nội dung chương thành danh sách các đoạn văn bản (paragraphs).
 * @param {string} rawContent 
 * @returns {string[]}
 */
export function parseContentToParagraphs(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return [];
  }

  // 1. Chuẩn hóa các thẻ ngắt dòng / ngắt đoạn HTML
  let text = rawContent
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');

  // 2. Loại bỏ tất cả các thẻ HTML còn lại (như <b>, <i>, <a>, <span>, <div>, v.v.)
  text = text.replace(/<[^>]+>/g, '');

  // 3. Giải mã các HTML entities thông dụng
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // 4. Chia tách thành các đoạn theo dòng trống và lọc bỏ các đoạn rỗng
  const paragraphs = text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return paragraphs;
}
