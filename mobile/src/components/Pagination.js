import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable Pagination component for React Native (Mobile)
 * Compact layout optimized for mobile screens.
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  style
}) {
  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const getPageItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }

    if (safeCurrentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', safeCurrentPage, '...', totalPages];
  };

  const pages = getPageItems();

  const handlePress = (target) => {
    if (target === '...' || target === safeCurrentPage) return;
    if (target >= 1 && target <= totalPages && onPageChange) {
      onPageChange(target);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label Trang x / y */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Trang <Text style={styles.infoCurrentText}>{safeCurrentPage}</Text> / {totalPages}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        {/* Nút Trước */}
        <TouchableOpacity
          style={[
            styles.navButton,
            safeCurrentPage <= 1 && styles.buttonDisabled
          ]}
          disabled={safeCurrentPage <= 1}
          onPress={() => handlePress(safeCurrentPage - 1)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-back" size={16} color={safeCurrentPage <= 1 ? '#6B7280' : '#E5E7EB'} />
          <Text style={[styles.navButtonText, safeCurrentPage <= 1 && styles.textDisabled]}>Trước</Text>
        </TouchableOpacity>

        {/* Các nút số trang & dấu ba chấm */}
        <View style={styles.pagesWrapper}>
          {pages.map((item, idx) => {
            if (item === '...') {
              return (
                <View key={`ellipsis-${idx}`} style={styles.ellipsisBox}>
                  <Text style={styles.ellipsisText}>...</Text>
                </View>
              );
            }

            const isCurrent = item === safeCurrentPage;

            return (
              <TouchableOpacity
                key={`page-${item}`}
                style={[
                  styles.pageButton,
                  isCurrent ? styles.pageButtonActive : styles.pageButtonInactive
                ]}
                disabled={isCurrent}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    isCurrent ? styles.pageButtonTextActive : styles.pageButtonTextInactive
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nút Sau */}
        <TouchableOpacity
          style={[
            styles.navButton,
            safeCurrentPage >= totalPages && styles.buttonDisabled
          ]}
          disabled={safeCurrentPage >= totalPages}
          onPress={() => handlePress(safeCurrentPage + 1)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <Text style={[styles.navButtonText, safeCurrentPage >= totalPages && styles.textDisabled]}>Sau</Text>
          <Ionicons name="chevron-forward" size={16} color={safeCurrentPage >= totalPages ? '#6B7280' : '#E5E7EB'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A38',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: {
    marginBottom: 8,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  infoCurrentText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#2A2A38',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 2,
  },
  navButtonText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  buttonDisabled: {
    opacity: 0.35,
    borderColor: '#1F1F2A',
  },
  textDisabled: {
    color: '#6B7280',
  },
  pagesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageButton: {
    minWidth: 34,
    height: 38,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonActive: {
    backgroundColor: '#ED1D24',
    borderWidth: 1,
    borderColor: '#ED1D24',
  },
  pageButtonInactive: {
    backgroundColor: '#0F0F14',
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  pageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
  },
  pageButtonTextActive: {
    color: '#FFFFFF',
  },
  pageButtonTextInactive: {
    color: '#9CA3AF',
  },
  ellipsisBox: {
    width: 20,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
});

